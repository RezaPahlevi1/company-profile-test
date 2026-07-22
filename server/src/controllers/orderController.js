import supabase from "../config/supabase.js";
import snap from "../config/midtrans.js";
import generateOrderNumber from "../utils/generateOrderNumber.js";
import {
  sendOrderCreatedEmail,
  sendPaymentSuccessEmail,
  sendFulfillmentUpdateEmail,
  sendInvoiceEmail,
} from "../utils/emailService.js";

const isDev = process.env.NODE_ENV !== "production";
const internalError = (err, res) => {
  console.error(err);
  return res.status(500).json({
    success: false,
    message: isDev ? err.message : "Internal server error",
  });
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

// ✅ Validasi format email sederhana
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ✅ Validasi format phone — hanya angka, +, spasi, tanda hubung
function isValidPhone(phone) {
  return /^[0-9+\-\s]{8,20}$/.test(phone);
}

// ✅ Sanitasi input search — strip karakter khusus PostgREST/SQL
// Hanya izinkan huruf, angka, spasi, tanda hubung, titik, dan @
function sanitizeSearch(input) {
  if (!input || typeof input !== "string") return "";
  return input
    .trim()
    .slice(0, 100) // batas panjang
    .replace(/[^a-zA-Z0-9\s\-_.@]/g, ""); // strip karakter berbahaya
}

// ✅ Cek apakah order pending sudah melewati expiry window
// Menggunakan kolom expires_at yang sudah di-set saat order dibuat
async function checkAndExpireOrder(order) {
  if (order.status !== "pending") return false;
  if (!order.expires_at) return false;

  const isExpired = Date.now() > new Date(order.expires_at).getTime();

  if (isExpired) {
    await supabase
      .from("orders")
      .update({ status: "failed" })
      .eq("order_number", order.order_number);
    return true;
  }

  return false;
}

// ✅ Ambil expiry minutes dari site_settings
async function getExpiryMinutes() {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "payment_expiry_minutes")
    .single();
  return Number(data?.value) || 1440;
}

// ✅ Ambil manual payment expiry minutes dari site_settings
async function getManualExpiryMinutes() {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "manual_payment_expiry_minutes")
    .single();
  return Number(data?.value) || 4320;
}

// ✅ Cek apakah campaign promo sedang aktif
async function getCampaignActive() {
  const { data: settingsRows } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["show_promo", "promo_starts_at", "promo_ends_at"]);

  const settings = (settingsRows || []).reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});

  if (settings.show_promo === "false") return false;

  const now = Date.now();
  const startsAt = settings.promo_starts_at
    ? new Date(settings.promo_starts_at).getTime()
    : null;
  const endsAt = settings.promo_ends_at
    ? new Date(settings.promo_ends_at).getTime()
    : null;

  if (!startsAt && !endsAt) return true;
  if (startsAt && now < startsAt) return false;
  if (endsAt && now > endsAt) return false;

  return true;
}

// Flow urutan fulfillment status
const PHYSICAL_FLOW = ["processing", "packed", "shipped", "delivered"];
const DIGITAL_FLOW = ["processing", "completed"];
const SERVICE_FLOW = ["processing", "completed"];

// ─────────────────────────────────────────────
// CREATE ORDER
// ─────────────────────────────────────────────
export const createOrder = async (req, res) => {
  let {
    buyer_name,
    buyer_email,
    buyer_phone,
    buyer_address,
    items,
    payment_method,
  } = req.body;

  if (typeof buyer_name === "string") buyer_name = buyer_name.trim();
  if (typeof buyer_email === "string") buyer_email = buyer_email.trim();
  if (typeof buyer_phone === "string") buyer_phone = buyer_phone.trim();
  if (typeof buyer_address === "string") buyer_address = buyer_address.trim();

  if (!buyer_name || !buyer_email || !buyer_phone || !buyer_address) {
    return res.status(400).json({
      success: false,
      message: "All buyer information is required",
    });
  }

  if (buyer_name.length > 100)
    return res.status(400).json({
      success: false,
      message: "Name is too long (max 100 characters)",
    });

  // ✅ Validasi format email
  if (!isValidEmail(buyer_email))
    return res.status(400).json({
      success: false,
      message: "Format email tidak valid",
    });

  if (buyer_email.length > 254)
    return res.status(400).json({
      success: false,
      message: "Email is too long (max 254 characters)",
    });

  // ✅ Validasi format phone
  if (!isValidPhone(buyer_phone))
    return res.status(400).json({
      success: false,
      message:
        "Format nomor HP tidak valid. Hanya angka, +, -, dan spasi yang diperbolehkan.",
    });

  if (buyer_address.length > 500)
    return res.status(400).json({
      success: false,
      message: "Address is too long (max 500 characters)",
    });

  if (!items || !Array.isArray(items) || items.length === 0)
    return res
      .status(400)
      .json({ success: false, message: "Order must have at least one item" });

  if (items.length > 50)
    return res.status(400).json({
      success: false,
      message: "Cannot order more than 50 different items at once",
    });

  const allowedItemTypes = ["product", "service"];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemType = item.item_type || "product"; // default backward-compatible

    if (!allowedItemTypes.includes(itemType))
      return res.status(400).json({
        success: false,
        message: "Invalid item_type. Must be 'product' or 'service'.",
      });

    const itemId = itemType === "service" ? item.service_id : item.product_id;
    if (!itemId)
      return res.status(400).json({
        success: false,
        message:
          itemType === "service"
            ? "Service ID is required"
            : "Product ID is required for each item",
      });

    // ✅ Quantity divalidasi sama untuk product maupun service (1-100)
    const qty = Number(item.quantity);
    if (isNaN(qty) || qty <= 0 || qty > 100)
      return res.status(400).json({
        success: false,
        message: "Invalid quantity. Must be a number between 1 and 100.",
      });
    items[i].quantity = qty;

    items[i].item_type = itemType;
  }

  // ✅ Order layanan tidak boleh dicampur dengan item lain, dan cuma 1 layanan per order
  const hasService = items.some((i) => i.item_type === "service");
  const hasProduct = items.some((i) => i.item_type === "product");
  if (hasService && (hasProduct || items.length > 1)) {
    return res.status(400).json({
      success: false,
      message: "Order layanan hanya boleh berisi 1 layanan per order",
    });
  }

  const resolvedPaymentMethod =
    payment_method === "manual" ? "manual" : "gateway";

  try {
    if (resolvedPaymentMethod === "gateway") {
      const { data: gatewaySetting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "gateway_payment_enabled")
        .single();

      if (gatewaySetting?.value?.trim().toLowerCase() === "false") {
        return res.status(400).json({
          success: false,
          message: "Pembayaran via gateway sedang tidak tersedia saat ini",
        });
      }
    }

    if (resolvedPaymentMethod === "manual") {
      const { data: bankSetting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "bank_account_info")
        .single();

      if (!bankSetting?.value?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Pembayaran manual belum tersedia saat ini",
        });
      }
    }

    const productItems = items.filter((i) => i.item_type === "product");
    const serviceItems = items.filter((i) => i.item_type === "service");

    let products = [];
    if (productItems.length > 0) {
      const productIds = productItems.map((item) => item.product_id);
      const { data, error: productError } = await supabase
        .from("products")
        .select(
          "id, name, price, is_active, is_promo, discount_percent, delivery_estimation",
        )
        .in("id", productIds);
      if (productError) throw productError;
      products = data;

      for (const item of productItems) {
        const product = products.find((p) => p.id === item.product_id);
        if (!product)
          return res
            .status(404)
            .json({ success: false, message: "Product not found" });
        if (!product.is_active)
          return res.status(400).json({
            success: false,
            message: `Product "${product.name}" is no longer available`,
          });
      }
    }

    let services = [];
    if (serviceItems.length > 0) {
      const serviceIds = serviceItems.map((item) => item.service_id);
      const { data, error: serviceError } = await supabase
        .from("services")
        .select(
          "id, name, price, is_active, is_orderable, is_promo, discount_percent, delivery_estimation",
        )
        .in("id", serviceIds);
      if (serviceError) throw serviceError;
      services = data;

      for (const item of serviceItems) {
        const service = services.find((s) => s.id === item.service_id);
        if (!service)
          return res
            .status(404)
            .json({ success: false, message: "Service not found" });
        if (!service.is_active || !service.is_orderable)
          return res.status(400).json({
            success: false,
            message: `Layanan "${service.name}" belum tersedia untuk pemesanan online`,
          });
        if (service.price == null)
          return res.status(400).json({
            success: false,
            message: `Layanan "${service.name}" belum memiliki harga`,
          });
      }
    }

    const campaignActive = await getCampaignActive();

    const orderItems = items.map((item) => {
      const isService = item.item_type === "service";
      const source = isService
        ? services.find((s) => s.id === item.service_id)
        : products.find((p) => p.id === item.product_id);

      const effectivePrice =
        campaignActive && source.is_promo && source.discount_percent > 0
          ? source.price - (source.price * source.discount_percent) / 100
          : source.price;

      return {
        item_type: item.item_type,
        product_id: isService ? null : item.product_id,
        service_id: isService ? item.service_id : null,
        product_name: source.name,
        price_at_purchase: Math.round(effectivePrice),
        quantity: item.quantity,
        delivery_estimation_snapshot: source.delivery_estimation || null,
      };
    });

    const total_amount = orderItems.reduce(
      (sum, item) => sum + item.price_at_purchase * item.quantity,
      0,
    );

    const order_number = generateOrderNumber();

    // ✅ Hitung dan simpan expires_at saat order dibuat
    let expiryMinutes;
    if (resolvedPaymentMethod === "manual") {
      expiryMinutes = await getManualExpiryMinutes();
    } else {
      expiryMinutes = await getExpiryMinutes();
    }
    const expiresAt = new Date(
      Date.now() + expiryMinutes * 60 * 1000,
    ).toISOString();

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
          payment_method: resolvedPaymentMethod,
          expires_at: expiresAt,
          ...(hasService && { fulfillment_type: "service" }),
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
      throw new Error("Failed to save order items");
    }

    // ✅ Manual payment — skip Midtrans
    if (resolvedPaymentMethod === "manual") {
      const { data: freshOrder } = await supabase
        .from("orders")
        .select("*")
        .eq("id", order.id)
        .single();

      sendOrderCreatedEmail(freshOrder || order, orderItems, "manual").catch(
        (err) =>
          console.error("Failed to send order created email:", err.message),
      );

      return res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: {
          order_number: order.order_number,
          total_amount: order.total_amount,
          payment_method: "manual",
        },
      });
    }

    // ✅ Gateway payment — flow Midtrans
    const midtransItems = orderItems.map((item) => ({
      id: item.product_id || item.service_id,
      price: Math.round(item.price_at_purchase),
      quantity: item.quantity,
      name: item.product_name.substring(0, 50),
    }));

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
      expiry: { unit: "minute", duration: expiryMinutes },
    };

    const snapToken = await snap.createTransaction(midtransParameter);

    const { data: freshOrder } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order.id)
      .single();

    sendOrderCreatedEmail(freshOrder || order, orderItems, "gateway").catch(
      (err) =>
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
        payment_method: "gateway",
      },
    });
  } catch (err) {
    return internalError(err, res);
  }
};

// ─────────────────────────────────────────────
// TRACK ORDER (public)
// ─────────────────────────────────────────────
export const trackOrder = async (req, res) => {
  const { orderNumber } = req.params;

  try {
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        order_number, buyer_name, buyer_email,
        total_amount, status, midtrans_payment_type,
        payment_method, manual_payment_note,
        fulfillment_type, fulfillment_status,
        shipping_courier, shipping_tracking_number, shipping_note,
        paid_at, created_at, expires_at,
        order_items ( item_type, product_id, service_id, product_name, price_at_purchase, quantity ),
        order_fulfillment_history ( id, status, note, created_at )
      `,
      )
      .eq("order_number", orderNumber)
      .order("created_at", {
        ascending: true,
        foreignTable: "order_fulfillment_history",
      })
      .single();

    if (error || !order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // ✅ Cek expired menggunakan expires_at
    if (order.status === "pending") {
      const expired = await checkAndExpireOrder(order);
      if (expired) order.status = "failed";
    }

    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    return internalError(err, res);
  }
};

// ─────────────────────────────────────────────
// MIDTRANS WEBHOOK
// ─────────────────────────────────────────────
export const handleMidtransWebhook = async (req, res) => {
  try {
    let notification;
    if (isDev) {
      // ✅ Di dev mode tetap pakai body langsung, tapi validasi field wajib ada
      const { order_id, transaction_status, gross_amount } = req.body;
      if (!order_id || !transaction_status || !gross_amount) {
        console.warn(
          "[Webhook][DEV] Invalid webhook payload — missing required fields",
        );
        return res
          .status(400)
          .json({ success: false, message: "Invalid webhook payload" });
      }
      console.warn(
        "[Webhook][DEV] Skipping Midtrans signature verification — development mode only. " +
          "NEVER expose this server publicly without switching NODE_ENV to production.",
      );
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
      gross_amount,
    } = notification;

    const order_id = rawOrderId.replace(/-R\d+$/, "");

    // ✅ Abaikan webhook untuk order manual
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("payment_method, status, total_amount")
      .eq("order_number", order_id)
      .single();

    if (!existingOrder) {
      console.error(
        `[Webhook] Order tidak ditemukan — order_number: ${order_id}. Notifikasi diabaikan.`,
      );
      return res.status(200).json({ success: true });
    }

    if (existingOrder.payment_method === "manual") {
      return res.status(200).json({ success: true });
    }

    const wasAlreadyPaid = existingOrder?.status === "paid";

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

    // ✅ Cross-check gross_amount dari Midtrans vs total_amount order kita
    if (orderStatus === "paid" && existingOrder) {
      const reportedAmount = Math.round(Number(gross_amount));
      const expectedAmount = Math.round(Number(existingOrder.total_amount));

      if (reportedAmount !== expectedAmount) {
        console.error(
          `[Webhook] AMOUNT MISMATCH — order_number: ${order_id}, expected: ${expectedAmount}, dilaporkan Midtrans: ${reportedAmount}. Status order TIDAK diubah jadi paid.`,
        );
        return res.status(200).json({ success: true });
      }
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

    if (orderStatus === "paid" && !wasAlreadyPaid) {
      const { data: fullOrder } = await supabase
        .from("orders")
        .select(
          `*, order_items(product_name, price_at_purchase, quantity, delivery_estimation_snapshot)`,
        )
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
    // ✅ Webhook error — log internal, kembalikan 500 generik
    console.error("[Webhook] Error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Webhook processing failed" });
  }
};

// ─────────────────────────────────────────────
// GET ALL ORDERS (admin)
// ─────────────────────────────────────────────
export const getAllOrders = async (req, res) => {
  const { status } = req.query;

  // ✅ Sanitasi search — strip karakter khusus, batasi panjang
  const search = sanitizeSearch(req.query.search);

  const safePage = Math.max(1, parseInt(req.query.page) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));

  try {
    const offset = (safePage - 1) * safeLimit;
    const now = new Date().toISOString();

    let query = supabase
      .from("orders")
      .select(
        `id, order_number, buyer_name, buyer_email,
          buyer_phone, total_amount, status, payment_method,
          midtrans_payment_type, fulfillment_type, fulfillment_status,
          paid_at, created_at, expires_at`,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + safeLimit - 1);

    if (status === "needs_action") {
      query = query.or(
        [
          `and(payment_method.eq.manual,status.in.(pending,under_review),or(expires_at.is.null,expires_at.gt.${now}))`,
          `and(status.eq.paid,fulfillment_type.is.null)`,
          `and(status.eq.paid,fulfillment_type.eq.physical,or(fulfillment_status.is.null,fulfillment_status.neq.delivered))`,
          `and(status.eq.paid,fulfillment_type.eq.digital,or(fulfillment_status.is.null,fulfillment_status.neq.completed))`,
          `and(status.eq.paid,fulfillment_type.eq.service,or(fulfillment_status.is.null,fulfillment_status.neq.completed))`,
        ].join(","),
      );
    } else if (status) {
      query = query.eq("status", status);
    }

    // ✅ search sudah disanitasi sebelum dipakai
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
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(count / safeLimit),
      },
    });
  } catch (err) {
    return internalError(err, res);
  }
};

// ─────────────────────────────────────────────
// GET ORDER BY ID (admin)
// ─────────────────────────────────────────────
export const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items ( id, item_type, product_id, service_id, product_name, price_at_purchase, quantity ),
        order_fulfillment_history ( id, status, note, created_at, admins ( name ) )
      `,
      )
      .eq("id", id)
      .order("created_at", {
        ascending: true,
        foreignTable: "order_fulfillment_history",
      })
      .single();

    if (error || !order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // ✅ Cek expired menggunakan expires_at
    if (order.status === "pending") {
      const expired = await checkAndExpireOrder(order);
      if (expired) order.status = "failed";
    }

    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    return internalError(err, res);
  }
};

// ─────────────────────────────────────────────
// REPAY ORDER (public)
// ─────────────────────────────────────────────
export const repayOrder = async (req, res) => {
  const { orderNumber } = req.params;

  try {
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `*, order_items ( product_id, service_id, product_name, price_at_purchase, quantity )`,
      )
      .eq("order_number", orderNumber)
      .single();

    if (error || !order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.payment_method === "manual") {
      return res.status(400).json({
        success: false,
        message:
          "Order dengan pembayaran manual tidak memerlukan repay. Silakan tunggu konfirmasi admin.",
      });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Order cannot be repaid. Current status: ${order.status}`,
      });
    }

    // ✅ Cek expired menggunakan expires_at
    const expired = await checkAndExpireOrder(order);
    if (expired) {
      return res.status(400).json({
        success: false,
        message: "Waktu pembayaran telah habis. Silakan buat order baru.",
      });
    }

    // ✅ Guard remainingMinutes agar tidak 0 atau negatif
    const remainingMs = new Date(order.expires_at).getTime() - Date.now();
    const remainingMinutes = Math.floor(remainingMs / 1000 / 60);

    if (remainingMinutes <= 1) {
      return res.status(400).json({
        success: false,
        message: "Waktu pembayaran hampir habis. Silakan buat order baru.",
      });
    }

    const midtransOrderId = `${order.order_number}-R${Date.now()}`;

    const midtransItems = order.order_items.map((item) => ({
      id: item.product_id || item.service_id,
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
      expiry: { unit: "minute", duration: remainingMinutes },
    };

    const snapToken = await snap.createTransaction(midtransParameter);

    return res.status(200).json({
      success: true,
      message: "Payment token generated",
      data: {
        snap_token: snapToken.token,
        snap_redirect_url: snapToken.redirect_url,
        remaining_minutes: remainingMinutes,
      },
    });
  } catch (err) {
    return internalError(err, res);
  }
};

// ─────────────────────────────────────────────
// UPDATE ORDER STATUS (admin) — payment status
// ─────────────────────────────────────────────
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, manual_payment_note } = req.body;

  const allowedStatuses = [
    "paid",
    "cancelled",
    "pending",
    "failed",
    "under_review",
  ];

  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${allowedStatuses.join(", ")}`,
    });
  }

  try {
    const { data: existing, error: findError } = await supabase
      .from("orders")
      .select("id, status, paid_at, payment_method")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // ✅ under_review hanya untuk order manual yang masih pending
    if (status === "under_review") {
      if (existing.payment_method !== "manual") {
        return res.status(400).json({
          success: false,
          message:
            "Status under_review hanya untuk order dengan pembayaran manual",
        });
      }
      if (existing.status !== "pending") {
        return res.status(400).json({
          success: false,
          message:
            "Hanya order berstatus pending yang bisa ditandai under_review",
        });
      }
    }

    // ✅ under_review tidak bisa langsung ke failed
    const invalidTransitions = {
      paid: ["paid", "failed", "cancelled"],
      cancelled: ["paid", "failed", "cancelled"],
      failed: ["failed"],
      under_review: ["failed"],
    };

    if (invalidTransitions[existing.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Tidak bisa mengubah status dari "${existing.status}" ke "${status}"`,
      });
    }

    const wasAlreadyPaid = existing.status === "paid";

    const updatePayload = {
      status,
      ...(status === "paid" &&
        !existing.paid_at && {
          paid_at: new Date().toISOString(),
          midtrans_payment_type: "manual_confirmation",
        }),
      ...(status === "paid" &&
        manual_payment_note && {
          manual_payment_note,
        }),
    };

    const { data, error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (status === "paid" && !wasAlreadyPaid) {
      const { data: fullOrder } = await supabase
        .from("orders")
        .select(
          `*, order_items(product_name, price_at_purchase, quantity, delivery_estimation_snapshot)`,
        )
        .eq("id", id)
        .single();

      if (fullOrder) {
        sendPaymentSuccessEmail(fullOrder, fullOrder.order_items).catch((err) =>
          console.error(
            "Failed to send manual payment success email:",
            err.message,
          ),
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data,
    });
  } catch (err) {
    return internalError(err, res);
  }
};

// ─────────────────────────────────────────────
// UPDATE FULFILLMENT (admin)
// ─────────────────────────────────────────────
export const updateFulfillment = async (req, res) => {
  const { id } = req.params;
  const {
    fulfillment_type,
    fulfillment_status,
    shipping_courier,
    shipping_tracking_number,
    shipping_note,
    note,
  } = req.body;

  try {
    const { data: existing, error: findError } = await supabase
      .from("orders")
      .select(
        "id, status, fulfillment_type, fulfillment_status, buyer_email, buyer_name, order_number",
      )
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (existing.status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Fulfillment hanya bisa diupdate untuk order yang sudah paid",
      });
    }

    // ✅ Tipe boleh diubah hanya jika fulfillment_status masih null
    if (
      existing.fulfillment_type &&
      fulfillment_type &&
      fulfillment_type !== existing.fulfillment_type
    ) {
      if (existing.fulfillment_status) {
        return res.status(400).json({
          success: false,
          message:
            "Tipe fulfillment tidak bisa diubah setelah proses fulfillment dimulai",
        });
      }
    }

    const resolvedType = existing.fulfillment_type || fulfillment_type;
    if (!resolvedType) {
      return res.status(400).json({
        success: false,
        message:
          "Fulfillment type harus ditentukan terlebih dahulu (physical/digital)",
      });
    }
    if (!["physical", "digital", "service"].includes(resolvedType)) {
      return res.status(400).json({
        success: false,
        message: "fulfillment_type harus physical, digital, atau service",
      });
    }

    if (fulfillment_status) {
      const flow =
        resolvedType === "physical"
          ? PHYSICAL_FLOW
          : resolvedType === "service"
            ? SERVICE_FLOW
            : DIGITAL_FLOW;

      if (!flow.includes(fulfillment_status)) {
        return res.status(400).json({
          success: false,
          message: `Status "${fulfillment_status}" tidak valid untuk tipe ${resolvedType}. Allowed: ${flow.join(", ")}`,
        });
      }

      const currentIdx = existing.fulfillment_status
        ? flow.indexOf(existing.fulfillment_status)
        : -1;
      const nextIdx = flow.indexOf(fulfillment_status);

      if (nextIdx !== currentIdx + 1) {
        return res.status(400).json({
          success: false,
          message: `Status fulfillment harus diupdate secara berurutan. Status berikutnya yang valid: "${flow[currentIdx + 1]}"`,
        });
      }
    }

    if (fulfillment_status === "shipped") {
      if (!shipping_courier?.trim() || !shipping_tracking_number?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Kurir dan nomor resi wajib diisi saat status shipped",
        });
      }
    }

    const updatePayload = {
      fulfillment_type: resolvedType,
      ...(fulfillment_status && { fulfillment_status }),
      ...(shipping_courier && { shipping_courier: shipping_courier.trim() }),
      ...(shipping_tracking_number && {
        shipping_tracking_number: shipping_tracking_number.trim(),
      }),
      ...(shipping_note !== undefined && { shipping_note }),
    };

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // ✅ Insert ke history
    if (
      fulfillment_status &&
      fulfillment_status !== existing.fulfillment_status
    ) {
      await supabase.from("order_fulfillment_history").insert({
        order_id: id,
        status: fulfillment_status,
        note: note || null,
        created_by: req.admin.id,
      });
    } else if (fulfillment_type && !existing.fulfillment_status) {
      await supabase.from("order_fulfillment_history").insert({
        order_id: id,
        status: "type_set",
        note: existing.fulfillment_type
          ? `Tipe fulfillment dikoreksi dari ${existing.fulfillment_type} ke ${resolvedType}`
          : `Tipe fulfillment ditetapkan: ${resolvedType}`,
        created_by: req.admin.id,
      });
    }

    if (
      fulfillment_status &&
      fulfillment_status !== existing.fulfillment_status
    ) {
      const { data: fullOrder } = await supabase
        .from("orders")
        .select(`*, order_items(product_name, price_at_purchase, quantity)`)
        .eq("id", id)
        .single();

      if (fullOrder) {
        sendFulfillmentUpdateEmail(
          fullOrder,
          fullOrder.order_items,
          fulfillment_status,
        ).catch((err) =>
          console.error("Failed to send fulfillment email:", err.message),
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Fulfillment updated",
      data: updatedOrder,
    });
  } catch (err) {
    return internalError(err, res);
  }
};

// ─────────────────────────────────────────────
// RESEND INVOICE (admin)
// ─────────────────────────────────────────────
export const resendInvoice = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: order, error } = await supabase
      .from("orders")
      .select(`*, order_items(product_name, price_at_purchase, quantity)`)
      .eq("id", id)
      .single();

    if (error || !order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Invoice hanya bisa dikirim untuk order yang sudah dibayar",
      });
    }

    const sent = await sendInvoiceEmail(order, order.order_items);

    if (!sent) {
      return res.status(502).json({
        success: false,
        message: "Gagal mengirim invoice. Silakan coba lagi.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invoice berhasil dikirim ulang",
    });
  } catch (err) {
    return internalError(err, res);
  }
};
