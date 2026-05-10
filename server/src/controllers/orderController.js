import supabase from "../config/supabase.js";
import snap from "../config/midtrans.js";
import generateOrderNumber from "../utils/generateOrderNumber.js";
import {
  sendOrderCreatedEmail,
  sendPaymentSuccessEmail,
} from "../utils/emailService.js";

export const createOrder = async (req, res) => {
  const { buyer_name, buyer_email, buyer_phone, buyer_address, items } =
    req.body;

  if (!buyer_name || !buyer_email || !buyer_phone || !buyer_address) {
    return res.status(400).json({
      success: false,
      message: "All buyer information is required",
    });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Order must have at least one item",
    });
  }

  try {
    const productIds = items.map((item) => item.product_id);
    const { data: products, error: productError } = await supabase
      .from("products")
      .select("id, name, price, is_active, is_promo, discount_percent")
      .in("id", productIds);

    if (productError) throw productError;

    for (const item of items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }
      if (!product.is_active) {
        return res.status(400).json({
          success: false,
          message: `Product "${product.name}" is no longer available`,
        });
      }
    }

    const orderItems = items.map((item) => {
      const product = products.find((p) => p.id === item.product_id);

      // Hitung harga efektif dengan mempertimbangkan promo
      const effectivePrice =
        product.is_promo && product.discount_percent > 0
          ? product.price - (product.price * product.discount_percent) / 100
          : product.price;

      return {
        product_id: item.product_id,
        product_name: product.name,
        price_at_purchase: Math.round(effectivePrice), // ✅ harga promo
        quantity: item.quantity || 1,
      };
    });

    const total_amount = orderItems.reduce(
      (sum, item) => sum + item.price_at_purchase * item.quantity,
      0,
    );

    const order_number = generateOrderNumber();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          order_number,
          buyer_name,
          buyer_email,
          buyer_phone,
          buyer_address,
          total_amount,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItemsPayload = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsPayload);

    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id);
      throw new Error(`Failed to save order items: ${itemsError.message}`);
    }

    const midtransItems = orderItems.map((item) => ({
      id: item.product_id,
      price: Math.round(item.price_at_purchase),
      quantity: item.quantity,
      name: item.product_name.substring(0, 50),
    }));

    const { data: expirySetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "payment_expiry_hours")
      .single();

    const expiryHours = Number(expirySetting?.value) || 24;

    const midtransParameter = {
      transaction_details: {
        order_id: order.order_number,
        gross_amount: Math.round(total_amount),
      },
      customer_details: {
        first_name: buyer_name,
        email: buyer_email,
        phone: buyer_phone,
        billing_address: { address: buyer_address },
      },
      item_details: midtransItems,
      expiry: {
        unit: "hour",
        duration: expiryHours,
      },
    };

    const snapToken = await snap.createTransaction(midtransParameter);

    // ✅ Email dikirim SETELAH semua proses berhasil
    // ✅ Re-fetch order untuk pastikan created_at dan semua field lengkap
    const { data: freshOrder } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order.id)
      .single();

    sendOrderCreatedEmail(freshOrder || order, orderItems).catch((err) =>
      console.error("Failed to send order created email:", err.message),
    );

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        order_number: order.order_number,
        total_amount: order.total_amount,
        snap_token: snapToken.token,
        snap_redirect_url: snapToken.redirect_url,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const trackOrder = async (req, res) => {
  const { orderNumber } = req.params;

  try {
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        order_number, buyer_name, buyer_email,
        total_amount, status, midtrans_payment_type,
        paid_at, created_at,
        order_items (
          product_name, price_at_purchase, quantity
        )
      `,
      )
      .eq("order_number", orderNumber)
      .single();

    if (error || !order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const handleMidtransWebhook = async (req, res) => {
  try {
    const isDev = process.env.NODE_ENV === "development";

    let notification;
    if (isDev) {
      notification = req.body;
    } else {
      notification = await snap.transaction.notification(req.body);
    }

    const {
      order_id: rawOrderId,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_id,
    } = notification;

    const order_id = rawOrderId.replace(/-R\d+$/, "");

    let orderStatus = "pending";

    if (transaction_status === "capture") {
      orderStatus = fraud_status === "accept" ? "paid" : "failed";
    } else if (transaction_status === "settlement") {
      orderStatus = "paid";
    } else if (["cancel", "deny", "expire"].includes(transaction_status)) {
      orderStatus = "failed";
    } else if (transaction_status === "pending") {
      orderStatus = "pending";
    }

    const updatePayload = {
      status: orderStatus,
      midtrans_transaction_id: transaction_id,
      midtrans_payment_type: payment_type,
      ...(orderStatus === "paid" && { paid_at: new Date().toISOString() }),
    };

    const { error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("order_number", order_id);

    if (error) throw error;

    if (orderStatus === "paid") {
      const { data: fullOrder } = await supabase
        .from("orders")
        .select(`*, order_items(product_name, price_at_purchase, quantity)`)
        .eq("order_number", order_id)
        .single();

      if (fullOrder) {
        sendPaymentSuccessEmail(fullOrder, fullOrder.order_items).catch((err) =>
          console.error("Failed to send payment success email:", err.message),
        );
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllOrders = async (req, res) => {
  const { status, search, page = 1, limit = 10 } = req.query;

  try {
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from("orders")
      .select(
        `
        id, order_number, buyer_name, buyer_email,
        buyer_phone, total_amount, status,
        midtrans_payment_type, paid_at, created_at
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (status) query = query.eq("status", status);
    if (search) {
      query = query.or(
        `buyer_name.ilike.%${search}%,buyer_email.ilike.%${search}%,order_number.ilike.%${search}%`,
      );
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          id, product_id, product_name,
          price_at_purchase, quantity
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error || !order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const repayOrder = async (req, res) => {
  const { orderNumber } = req.params;

  try {
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          product_id, product_name, price_at_purchase, quantity
        )
      `,
      )
      .eq("order_number", orderNumber)
      .single();

    if (error || !order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Order cannot be repaid. Current status: ${order.status}`,
      });
    }

    // ✅ Ambil expiry setting dari database — sama seperti createOrder
    const { data: expirySetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "payment_expiry_hours")
      .single();

    const expiryHours = Number(expirySetting?.value) || 24;

    // ✅ Hitung sisa waktu dari created_at order, bukan dari sekarang
    // Supaya total window pembayaran tetap = expiryHours sejak order dibuat
    const orderCreatedAt = new Date(order.created_at).getTime();
    const expiredAt = orderCreatedAt + expiryHours * 60 * 60 * 1000;
    const now = Date.now();
    const remainingMs = expiredAt - now;
    // Minimal 1 menit agar Midtrans tidak reject, maksimal expiryHours penuh
    const remainingMinutes = Math.floor(remainingMs / 1000 / 60);

    if (remainingMinutes < 1) {
      return res.status(400).json({
        success: false,
        message: "Waktu pembayaran telah habis. Silakan buat order baru.",
      });
    }

    const midtransOrderId = `${order.order_number}-R${Date.now()}`;

    const midtransItems = order.order_items.map((item) => ({
      id: item.product_id,
      price: Math.round(item.price_at_purchase),
      quantity: item.quantity,
      name: item.product_name.substring(0, 50),
    }));

    const midtransParameter = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: Math.round(order.total_amount),
      },
      customer_details: {
        first_name: order.buyer_name,
        email: order.buyer_email,
        phone: order.buyer_phone,
        billing_address: { address: order.buyer_address },
      },
      item_details: midtransItems,
      // ✅ Gunakan sisa menit, bukan expiryHours penuh dari sekarang
      expiry: {
        unit: "minute",
        duration: remainingMinutes,
      },
    };

    const snapToken = await snap.createTransaction(midtransParameter);

    return res.status(200).json({
      success: true,
      message: "Payment token generated",
      data: {
        snap_token: snapToken.token,
        snap_redirect_url: snapToken.redirect_url,
        remaining_minutes: remainingMinutes, // opsional — bisa dipakai frontend untuk info
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = ["paid", "cancelled", "pending", "failed"];

  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${allowedStatuses.join(", ")}`,
    });
  }

  try {
    const { data: existing, error: findError } = await supabase
      .from("orders")
      .select("id, status, paid_at")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const updatePayload = {
      status,
      ...(status === "paid" &&
        !existing.paid_at && {
          paid_at: new Date().toISOString(),
          midtrans_payment_type: "manual_confirmation",
        }),
    };

    const { data, error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
