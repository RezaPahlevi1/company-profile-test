import supabase from "../config/supabase.js";
import snap from "../config/midtrans.js";
import generateOrderNumber from "../utils/generateOrderNumber.js";
import {
  sendOrderCreatedEmail,
  sendPaymentSuccessEmail,
  sendFulfillmentUpdateEmail,
} from "../utils/emailService.js";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

// ✅ Cek apakah order pending sudah melewati expiry window
// Berlaku untuk SEMUA order pending (gateway maupun manual)
async function checkAndExpireOrder(order, expiryMinutes) {
  if (order.status !== "pending") return false;

  if (order.payment_method === "manual") {
    const manualExpiryMinutes = await getManualExpiryMinutes();
    const orderCreatedAt = new Date(order.created_at).getTime();
    const expiredAt = orderCreatedAt + manualExpiryMinutes * 60 * 1000;
    const isExpired = Date.now() > expiredAt;

    if (isExpired) {
      await supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("order_number", order.order_number);
      return true;
    }
    return false;
  }

  // ✅ Gateway payment — tetap pakai expiry menit
  const orderCreatedAt = new Date(order.created_at).getTime();
  const expiredAt = orderCreatedAt + expiryMinutes * 60 * 1000;
  const isExpired = Date.now() > expiredAt;

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
  return Number(data?.value) || 4320; // default 4320 menit = 3 hari
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

// ✅ Flow urutan fulfillment status — dipakai di controller dan validasi
const PHYSICAL_FLOW = ["processing", "packed", "shipped", "delivered"];
const DIGITAL_FLOW = ["processing", "completed"];

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
  if (buyer_email.length > 100)
    return res.status(400).json({
      success: false,
      message: "Email is too long (max 100 characters)",
    });
  if (buyer_phone.length > 30)
    return res.status(400).json({
      success: false,
      message: "Phone number is too long (max 30 characters)",
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

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.product_id)
      return res.status(400).json({
        success: false,
        message: "Product ID is required for each item",
      });
    const qty = Number(item.quantity);
    if (isNaN(qty) || qty <= 0 || qty > 100)
      return res.status(400).json({
        success: false,
        message: "Invalid quantity. Must be a number between 1 and 100.",
      });
    items[i].quantity = qty;
  }

  // ✅ Validasi payment_method — hanya gateway atau manual
  const resolvedPaymentMethod =
    payment_method === "manual" ? "manual" : "gateway";

  try {
    const productIds = items.map((item) => item.product_id);

    // ✅ Jika manual, pastikan bank_account_info sudah diisi admin
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
    const { data: products, error: productError } = await supabase
      .from("products")
      .select("id, name, price, is_active, is_promo, discount_percent")
      .in("id", productIds);

    if (productError) throw productError;

    for (const item of items) {
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

    const campaignActive = await getCampaignActive();

    const orderItems = items.map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      const effectivePrice =
        campaignActive && product.is_promo && product.discount_percent > 0
          ? product.price - (product.price * product.discount_percent) / 100
          : product.price;
      return {
        product_id: item.product_id,
        product_name: product.name,
        price_at_purchase: Math.round(effectivePrice),
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
          payment_method: resolvedPaymentMethod,
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
      id: item.product_id,
      price: Math.round(item.price_at_purchase),
      quantity: item.quantity,
      name: item.product_name.substring(0, 50),
    }));

    const expiryMinutes = await getExpiryMinutes();

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
    return res.status(500).json({ success: false, message: err.message });
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
        paid_at, created_at,
        order_items ( product_name, price_at_purchase, quantity ),
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

    // ✅ Expiry berlaku untuk semua order pending termasuk manual
    if (order.status === "pending") {
      const expiryMinutes = await getExpiryMinutes();
      const expired = await checkAndExpireOrder(order, expiryMinutes);
      if (expired) order.status = "failed";
    }

    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// MIDTRANS WEBHOOK
// ─────────────────────────────────────────────
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

    // ✅ Fix celah 5 — abaikan webhook untuk order manual
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("payment_method")
      .eq("order_number", order_id)
      .single();

    if (existingOrder?.payment_method === "manual") {
      return res.status(200).json({ success: true });
    }

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

// ─────────────────────────────────────────────
// GET ALL ORDERS (admin)
// ─────────────────────────────────────────────
export const getAllOrders = async (req, res) => {
  const { status, search } = req.query;

  // ✅ Validasi dan batasi pagination parameter
  const safePage = Math.max(1, parseInt(req.query.page) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));

  try {
    const offset = (safePage - 1) * safeLimit;

    let query = supabase
      .from("orders")
      .select(
        `id, order_number, buyer_name, buyer_email,
          buyer_phone, total_amount, status, payment_method,
          midtrans_payment_type, fulfillment_type, fulfillment_status,
          paid_at, created_at`,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + safeLimit - 1);

    if (status === "needs_action") {
      // ✅ Gabungan semua kondisi yang butuh tindakan admin
      query = query.or(
        [
          // Manual payment belum dikonfirmasi
          `and(payment_method.eq.manual,status.in.(pending,under_review))`,
          // Paid tapi fulfillment belum dimulai
          `and(status.eq.paid,fulfillment_type.is.null)`,
          // Paid, tipe sudah dipilih, tapi belum selesai
          `and(status.eq.paid,fulfillment_type.eq.physical,fulfillment_status.neq.delivered)`,
          `and(status.eq.paid,fulfillment_type.eq.digital,fulfillment_status.neq.completed)`,
        ].join(","),
      );
    } else if (status) {
      query = query.eq("status", status);
    }
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
    return res.status(500).json({ success: false, message: err.message });
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
        order_items ( id, product_id, product_name, price_at_purchase, quantity ),
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

    if (order.status === "pending") {
      const expiryMinutes = await getExpiryMinutes();
      const expired = await checkAndExpireOrder(order, expiryMinutes);
      if (expired) order.status = "failed";
    }

    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
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
        `*, order_items ( product_id, product_name, price_at_purchase, quantity )`,
      )
      .eq("order_number", orderNumber)
      .single();

    if (error || !order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // ✅ Fix celah 4 — repay tidak berlaku untuk order manual
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

    const expiryMinutes = await getExpiryMinutes();
    const expired = await checkAndExpireOrder(order, expiryMinutes);
    if (expired) {
      return res.status(400).json({
        success: false,
        message: "Waktu pembayaran telah habis. Silakan buat order baru.",
      });
    }

    const orderCreatedAt = new Date(order.created_at).getTime();
    const expiredAt = orderCreatedAt + expiryMinutes * 60 * 1000;
    const remainingMinutes = Math.floor((expiredAt - Date.now()) / 1000 / 60);

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
    return res.status(500).json({ success: false, message: err.message });
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

    // ✅ Validasi transisi status yang logis
    const invalidTransitions = {
      paid: ["paid", "failed"], // sudah paid tidak bisa paid/failed lagi
      cancelled: ["paid", "failed", "cancelled"], // sudah cancelled tidak bisa berubah
      failed: ["failed"], // sudah failed tidak bisa failed lagi
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
        .select(`*, order_items(product_name, price_at_purchase, quantity)`)
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
    return res.status(500).json({ success: false, message: err.message });
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

    // ✅ Fix celah 3 — fulfillment_type tidak bisa diubah setelah ditetapkan
    if (
      existing.fulfillment_type &&
      fulfillment_type &&
      fulfillment_type !== existing.fulfillment_type
    ) {
      return res.status(400).json({
        success: false,
        message: "Tipe fulfillment tidak bisa diubah setelah ditetapkan",
      });
    }

    const resolvedType = existing.fulfillment_type || fulfillment_type;
    if (!resolvedType) {
      return res.status(400).json({
        success: false,
        message:
          "Fulfillment type harus ditentukan terlebih dahulu (physical/digital)",
      });
    }
    if (!["physical", "digital"].includes(resolvedType)) {
      return res.status(400).json({
        success: false,
        message: "fulfillment_type harus physical atau digital",
      });
    }

    // ✅ Fix celah 2 — validasi urutan status harus berurutan
    if (fulfillment_status) {
      const flow = resolvedType === "physical" ? PHYSICAL_FLOW : DIGITAL_FLOW;

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

      // ✅ Harus tepat satu langkah maju
      if (nextIdx !== currentIdx + 1) {
        return res.status(400).json({
          success: false,
          message: `Status fulfillment harus diupdate secara berurutan. Status berikutnya yang valid: "${flow[currentIdx + 1]}"`,
        });
      }
    }

    // ✅ Jika shipped, kurir dan resi wajib diisi
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
    if (fulfillment_status) {
      await supabase.from("order_fulfillment_history").insert({
        order_id: id,
        status: fulfillment_status,
        note: note || null,
        created_by: req.admin.id,
      });
    } else if (fulfillment_type && !existing.fulfillment_type) {
      await supabase.from("order_fulfillment_history").insert({
        order_id: id,
        status: "type_set",
        note: `Tipe fulfillment ditetapkan: ${resolvedType}`,
        created_by: req.admin.id,
      });
    }

    // ✅ Kirim email notifikasi ke buyer jika fulfillment_status berubah
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
    return res.status(500).json({ success: false, message: err.message });
  }
};
