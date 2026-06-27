import { Resend } from "resend";
import sanitizeHtml from "sanitize-html";
import supabase from "../config/supabase.js";
import { generateInvoiceBuffer } from "./invoiceGenerator.js";

const resend = new Resend(process.env.RESEND_API_KEY);

// ============================================================
// SECURITY HELPERS
// ============================================================

// ✅ Escape karakter HTML — mencegah injeksi dari data user
// (buyer_name, product_name, shipping info, dll)
const escapeHtml = (str) => {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// ✅ Sanitasi HTML broadcast dari Tiptap editor
// Izinkan tag formatting umum, strip script dan event handler
const sanitizeBroadcastHtml = (dirty) => {
  if (!dirty) return "";
  return sanitizeHtml(dirty, {
    allowedTags: [
      "p", "br", "strong", "em", "u", "s", "blockquote",
      "code", "pre", "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
      "hr", "div", "span",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
      "*": ["class", "style"],
    },
    allowedSchemes: ["https", "http", "mailto"],
    // ✅ Paksa rel noopener pada semua link
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: "noopener noreferrer",
          target: attribs.target || "_blank",
        },
      }),
    },
  });
};

// ============================================================
// RENDER ENGINE
// ============================================================
const renderTemplate = (text, variables) => {
  if (!text) return "";
  return Object.entries(variables).reduce((result, [key, value]) => {
    return result.replaceAll(`{{${key}}}`, value ?? "");
  }, text);
};

const formatCurrency = (amount) =>
  `Rp ${Number(amount).toLocaleString("id-ID")}`;

const formatDate = (date) =>
  new Date(date).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ============================================================
// AMBIL TEMPLATE DARI DATABASE
// ============================================================
const getTemplate = async (templateKey) => {
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("template_key", templateKey)
    .single();

  if (error || !data) throw new Error(`Template ${templateKey} not found`);
  return data;
};

// ============================================================
// AMBIL SITE SETTINGS
// ============================================================
const getSiteSettings = async () => {
  const { data } = await supabase.from("site_settings").select("key, value");
  return (data || []).reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});
};

// ============================================================
// BUILD HTML EMAIL
// ============================================================
const buildEmailHtml = (template, contentHtml, variables) => {
  // ✅ Variabel template (site_name, dll) di-escape karena bisa diubah admin
  const greeting = renderTemplate(template.greeting, variables);
  const bodyMessage = renderTemplate(template.body_message, variables);
  const footerText = renderTemplate(template.footer_text, variables);
  const headerColor = template.header_color || "#2563eb";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">

    <div style="background:${escapeHtml(headerColor)};padding:36px 32px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">
        ${escapeHtml(variables.site_name || "CompanyName")}
      </h1>
    </div>

    <div style="padding:32px;">
      <p style="color:#334155;font-size:15px;margin:0 0 16px;">
        ${greeting}
      </p>
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
        ${bodyMessage}
      </p>
      ${contentHtml}
    </div>

    <div style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.6;">
        ${footerText}
      </p>
    </div>
  </div>
</body>
</html>`;
};

// ============================================================
// CONTENT BUILDERS
// ============================================================

// ── Tabel item (dipakai di beberapa template) ────────────────
const buildItemsTable = (items, totalAmount, accentColor = "#1d4ed8") => `
  <h3 style="color:#0f172a;font-size:15px;margin:0 0 10px;">Item Pesanan</h3>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
    <thead>
      <tr style="background:#f8fafc;">
        <th style="text-align:left;padding:8px 10px;color:#64748b;font-size:12px;border-bottom:1px solid #e2e8f0;">Produk</th>
        <th style="text-align:center;padding:8px 10px;color:#64748b;font-size:12px;border-bottom:1px solid #e2e8f0;">Qty</th>
        <th style="text-align:right;padding:8px 10px;color:#64748b;font-size:12px;border-bottom:1px solid #e2e8f0;">Harga</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map(
          (item) => `
        <tr>
          <td style="padding:10px;color:#334155;font-size:13px;border-bottom:1px solid #f1f5f9;">${escapeHtml(item.product_name)}</td>
          <td style="padding:10px;color:#334155;font-size:13px;text-align:center;border-bottom:1px solid #f1f5f9;">${escapeHtml(item.quantity)}</td>
          <td style="padding:10px;color:#334155;font-size:13px;text-align:right;border-bottom:1px solid #f1f5f9;">${formatCurrency(item.price_at_purchase * item.quantity)}</td>
        </tr>
      `,
        )
        .join("")}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2" style="padding:10px;font-weight:700;font-size:14px;color:#0f172a;">Total</td>
        <td style="padding:10px;font-weight:800;font-size:16px;text-align:right;color:${escapeHtml(accentColor)};">${formatCurrency(totalAmount)}</td>
      </tr>
    </tfoot>
  </table>`;

// ── Order Created — Gateway ──────────────────────────────────
const buildOrderCreatedGatewayContent = (order, items, variables) => {
  const trackUrl = `${process.env.CLIENT_URL}/order/${escapeHtml(order.order_number)}`;
  return `
    <div style="background:#eff6ff;border:2px dashed #93c5fd;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <p style="color:#64748b;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Nomor Order</p>
      <p style="color:#1d4ed8;font-size:22px;font-weight:800;margin:0;letter-spacing:2px;font-family:monospace;">
        ${escapeHtml(order.order_number)}
      </p>
    </div>

    ${buildItemsTable(items, order.total_amount)}

    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px;margin-bottom:20px;">
      <p style="color:#92400e;font-size:13px;margin:0;">
        ⚠️ Segera selesaikan pembayaran sebelum batas waktu yang ditentukan.
      </p>
    </div>

    <div style="text-align:center;">
      <a href="${trackUrl}" style="display:inline-block;background:${escapeHtml(variables.header_color || "#2563eb")};color:white;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:600;font-size:14px;">
        Lacak Status Pesanan
      </a>
    </div>`;
};

// ── Order Created — Manual Payment ──────────────────────────
const buildOrderCreatedManualContent = (order, items, variables) => {
  const trackUrl = `${process.env.CLIENT_URL}/order/${escapeHtml(order.order_number)}`;
  // ✅ bank_account_info dari admin — escape untuk mencegah injeksi
  const bankInfo = escapeHtml(variables.bank_account_info || "");
  const verificationHours = escapeHtml(
    variables.manual_payment_verification_hours || "1x24 jam kerja",
  );

  return `
    <div style="background:#eff6ff;border:2px dashed #93c5fd;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <p style="color:#64748b;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Nomor Order</p>
      <p style="color:#1d4ed8;font-size:22px;font-weight:800;margin:0;letter-spacing:2px;font-family:monospace;">
        ${escapeHtml(order.order_number)}
      </p>
    </div>

    ${buildItemsTable(items, order.total_amount)}

    ${
      bankInfo
        ? `
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="color:#15803d;font-size:13px;font-weight:700;margin:0 0 10px;">
        💳 Informasi Rekening Transfer
      </p>
      <pre style="color:#1e3a2f;font-size:13px;margin:0;white-space:pre-wrap;font-family:inherit;line-height:1.7;">${bankInfo}</pre>
    </div>`
        : ""
    }

    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:14px;margin-bottom:20px;">
      <p style="color:#854d0e;font-size:13px;margin:0 0 6px;font-weight:600;">📋 Langkah Selanjutnya</p>
      <ol style="color:#713f12;font-size:13px;margin:0;padding-left:18px;line-height:1.8;">
        <li>Transfer sesuai total di atas ke rekening yang tertera</li>
        <li>Gunakan nomor order sebagai berita acara transfer</li>
        <li>Tim kami akan memverifikasi pembayaran dalam <strong>${verificationHours}</strong></li>
        <li>Status pesanan akan diperbarui setelah pembayaran terkonfirmasi</li>
      </ol>
    </div>

    <div style="text-align:center;">
      <a href="${trackUrl}" style="display:inline-block;background:${escapeHtml(variables.header_color || "#2563eb")};color:white;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:600;font-size:14px;">
        Lacak Status Pesanan
      </a>
    </div>`;
};

// ── Payment Success ──────────────────────────────────────────
const buildPaymentSuccessContent = (order, items, variables) => {
  const trackUrl = `${process.env.CLIENT_URL}/order/${escapeHtml(order.order_number)}`;

  return `
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div>
          <p style="color:#64748b;font-size:11px;margin:0;text-transform:uppercase;letter-spacing:1px;">Nomor Order</p>
          <p style="color:#15803d;font-size:16px;font-weight:800;margin:4px 0 0;font-family:monospace;">${escapeHtml(order.order_number)}</p>
        </div>
        <div style="text-align:right;">
          <p style="color:#64748b;font-size:11px;margin:0;text-transform:uppercase;letter-spacing:1px;">Total Dibayar</p>
          <p style="color:#15803d;font-size:18px;font-weight:800;margin:4px 0 0;">${formatCurrency(order.total_amount)}</p>
        </div>
      </div>
      ${
        order.midtrans_payment_type
          ? `
        <p style="color:#64748b;font-size:12px;margin:10px 0 0;padding-top:10px;border-top:1px solid #bbf7d0;">
          Metode: <strong style="color:#15803d;">${escapeHtml(order.midtrans_payment_type.replace(/_/g, " "))}</strong>
          ${order.paid_at ? ` · ${formatDate(order.paid_at)}` : ""}
        </p>`
          : ""
      }
    </div>

    ${
      variables.delivery_estimation
        ? `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px;margin-bottom:20px;">
      <p style="color:#1e40af;font-size:13px;margin:0;">
        📦 <strong>Estimasi penyelesaian:</strong> ${escapeHtml(variables.delivery_estimation)}
      </p>
    </div>`
        : ""
    }

    ${buildItemsTable(items, order.total_amount, "#059669")}

    <div style="text-align:center;">
      <a href="${trackUrl}" style="display:inline-block;background:${escapeHtml(variables.header_color || "#059669")};color:white;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:600;font-size:14px;">
        Lihat Detail Pesanan
      </a>
    </div>`;
};

// ── Fulfillment Update ───────────────────────────────────────
const FULFILLMENT_STATUS_LABELS = {
  processing: {
    label: "Pesanan Diproses",
    emoji: "⚙️",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
  },
  packed: {
    label: "Pesanan Dikemas",
    emoji: "📦",
    color: "#b45309",
    bg: "#fffbeb",
    border: "#fde68a",
  },
  shipped: {
    label: "Pesanan Dikirim",
    emoji: "🚚",
    color: "#0369a1",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  delivered: {
    label: "Pesanan Tiba",
    emoji: "✅",
    color: "#15803d",
    bg: "#f0fdf4",
    border: "#86efac",
  },
  completed: {
    label: "Pesanan Selesai",
    emoji: "🎉",
    color: "#15803d",
    bg: "#f0fdf4",
    border: "#86efac",
  },
};

const buildFulfillmentUpdateContent = (
  order,
  items,
  fulfillmentStatus,
  variables,
) => {
  const trackUrl = `${process.env.CLIENT_URL}/order/${escapeHtml(order.order_number)}`;
  const meta = FULFILLMENT_STATUS_LABELS[fulfillmentStatus] || {
    label: fulfillmentStatus,
    emoji: "📋",
    color: "#475569",
    bg: "#f8fafc",
    border: "#e2e8f0",
  };

  // ✅ Semua data shipping dari DB di-escape
  const shippingBlock =
    fulfillmentStatus === "shipped" &&
    order.shipping_courier &&
    order.shipping_tracking_number
      ? `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin-bottom:20px;">
      <p style="color:#1e40af;font-size:13px;font-weight:700;margin:0 0 10px;">🔍 Informasi Pengiriman</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:4px 0;color:#64748b;font-size:13px;width:100px;">Kurir</td>
          <td style="padding:4px 0;color:#0f172a;font-size:13px;font-weight:600;">${escapeHtml(order.shipping_courier)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#64748b;font-size:13px;">No. Resi</td>
          <td style="padding:4px 0;color:#1d4ed8;font-size:14px;font-weight:800;font-family:monospace;">${escapeHtml(order.shipping_tracking_number)}</td>
        </tr>
        ${
          order.shipping_note
            ? `
        <tr>
          <td style="padding:4px 0;color:#64748b;font-size:13px;">Catatan</td>
          <td style="padding:4px 0;color:#334155;font-size:13px;">${escapeHtml(order.shipping_note)}</td>
        </tr>`
            : ""
        }
      </table>
    </div>`
      : "";

  return `
    <div style="background:${escapeHtml(meta.bg)};border:1px solid ${escapeHtml(meta.border)};border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <p style="font-size:32px;margin:0 0 8px;">${meta.emoji}</p>
      <p style="color:${escapeHtml(meta.color)};font-size:18px;font-weight:800;margin:0;">${escapeHtml(meta.label)}</p>
      <p style="color:#64748b;font-size:12px;margin:6px 0 0;font-family:monospace;">${escapeHtml(order.order_number)}</p>
    </div>

    ${shippingBlock}

    <div style="background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:20px;">
      <p style="color:#334155;font-size:13px;margin:0;">
        Pantau status terbaru pesanan Anda melalui halaman lacak pesanan.
      </p>
    </div>

    ${buildItemsTable(items, order.total_amount)}

    <div style="text-align:center;">
      <a href="${trackUrl}" style="display:inline-block;background:${escapeHtml(meta.color)};color:white;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:600;font-size:14px;">
        Lacak Pesanan
      </a>
    </div>`;
};

// ============================================================
// SEND FUNCTIONS
// ============================================================

// ── sendOrderCreatedEmail ────────────────────────────────────
export const sendOrderCreatedEmail = async (
  order,
  items,
  paymentMethod = "gateway",
) => {
  try {
    const [template, siteSettings] = await Promise.all([
      getTemplate("order_created"),
      getSiteSettings(),
    ]);

    const variables = {
      buyer_name: escapeHtml(order.buyer_name),
      order_number: escapeHtml(order.order_number),
      total_amount: formatCurrency(order.total_amount),
      order_date: formatDate(order.created_at),
      site_name: escapeHtml(siteSettings.site_name || "CompanyName"),
      track_url: `${process.env.CLIENT_URL}/order/${escapeHtml(order.order_number)}`,
      delivery_estimation: escapeHtml(siteSettings.delivery_estimation || ""),
      bank_account_info: siteSettings.bank_account_info || "",
      manual_payment_verification_hours: escapeHtml(
        siteSettings.manual_payment_verification_hours || "1x24 jam kerja",
      ),
      header_color: template.header_color,
    };

    const subject = renderTemplate(template.subject, variables);

    const contentHtml =
      paymentMethod === "manual"
        ? buildOrderCreatedManualContent(order, items, variables)
        : buildOrderCreatedGatewayContent(order, items, variables);

    const html = buildEmailHtml(template, contentHtml, variables);

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: order.buyer_email,
      subject,
      html,
    });

    if (error) throw error;
    console.log("Order created email sent:", data?.id);
    return true;
  } catch (err) {
    console.error("sendOrderCreatedEmail error:", err);
    return false;
  }
};

// ── sendPaymentSuccessEmail ──────────────────────────────────
export const sendPaymentSuccessEmail = async (order, items) => {
  try {
    const [template, siteSettings] = await Promise.all([
      getTemplate("payment_success"),
      getSiteSettings(),
    ]);

    const variables = {
      buyer_name: escapeHtml(order.buyer_name),
      order_number: escapeHtml(order.order_number),
      total_amount: formatCurrency(order.total_amount),
      payment_method: escapeHtml(
        order.midtrans_payment_type?.replace(/_/g, " ") || "",
      ),
      paid_at: order.paid_at ? formatDate(order.paid_at) : "",
      site_name: escapeHtml(siteSettings.site_name || "CompanyName"),
      track_url: `${process.env.CLIENT_URL}/order/${escapeHtml(order.order_number)}`,
      delivery_estimation: escapeHtml(siteSettings.delivery_estimation || ""),
      header_color: template.header_color,
    };

    const subject = renderTemplate(template.subject, variables);
    const contentHtml = buildPaymentSuccessContent(order, items, variables);
    const html = buildEmailHtml(template, contentHtml, variables);

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: order.buyer_email,
      subject,
      html,
    });

    if (error) throw error;
    console.log("Payment success email sent:", data?.id);
    return true;
  } catch (err) {
    console.error("sendPaymentSuccessEmail error:", err);
    return false;
  }
};

// ── sendFulfillmentUpdateEmail ───────────────────────────────
export const sendFulfillmentUpdateEmail = async (
  order,
  items,
  fulfillmentStatus,
) => {
  try {
    const [template, siteSettings] = await Promise.all([
      getTemplate("order_created"),
      getSiteSettings(),
    ]);

    const meta = FULFILLMENT_STATUS_LABELS[fulfillmentStatus] || {
      label: fulfillmentStatus,
      emoji: "📋",
    };

    const variables = {
      buyer_name: escapeHtml(order.buyer_name),
      order_number: escapeHtml(order.order_number),
      total_amount: formatCurrency(order.total_amount),
      site_name: escapeHtml(siteSettings.site_name || "CompanyName"),
      track_url: `${process.env.CLIENT_URL}/order/${escapeHtml(order.order_number)}`,
      header_color: template.header_color,
      fulfillment_status_label: escapeHtml(meta.label),
    };

    // ✅ Subject override — tidak pakai template subject
    const subject = `${meta.emoji} Update Pesanan: ${meta.label} — ${order.order_number}`;

    const contentHtml = buildFulfillmentUpdateContent(
      order,
      items,
      fulfillmentStatus,
      variables,
    );
    const html = buildEmailHtml(template, contentHtml, variables);

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: order.buyer_email,
      subject,
      html,
    });

    if (error) throw error;
    console.log("Fulfillment update email sent:", data?.id);
    return true;
  } catch (err) {
    console.error("sendFulfillmentUpdateEmail error:", err);
    return false;
  }
};

// ── sendBroadcastEmail ───────────────────────────────────────
export const sendBroadcastEmail = async (broadcast, recipients) => {
  if (!recipients.length) return { sent: 0, failed: 0 };

  const [siteSettings, template] = await Promise.all([
    getSiteSettings(),
    getTemplate("broadcast"),
  ]);

  const siteName = siteSettings.site_name || "CompanyName";
  const headerColor = template.header_color || "#2563eb";
  const footerText = renderTemplate(template.footer_text || "", {
    site_name: escapeHtml(siteName),
  });

  // ✅ Sanitasi konten broadcast dari Tiptap sebelum dimasukkan ke email
  const safeBodyHtml = sanitizeBroadcastHtml(broadcast.body_message);

  let sent = 0;
  let failed = 0;

  const batchSize = 50;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map((recipient) => {
        const variables = {
          buyer_name: escapeHtml(recipient.buyer_name || recipient.name || ""),
          site_name: escapeHtml(siteName),
        };

        const subject = renderTemplate(broadcast.subject, variables);
        const greeting = template.greeting
          ? renderTemplate(template.greeting, variables)
          : "";

        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
    <div style="background:${escapeHtml(headerColor)};padding:36px 32px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">${escapeHtml(siteName)}</h1>
    </div>
    <div style="padding:32px;">
      ${greeting ? `<p style="color:#334155;font-size:15px;margin:0 0 16px;">${greeting}</p>` : ""}
      <div style="color:#475569;font-size:15px;line-height:1.7;">${safeBodyHtml}</div>
    </div>
    <div style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.6;">${footerText}</p>
    </div>
  </div>
</body>
</html>`;

        return resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL,
          to: recipient.buyer_email || recipient.email,
          subject,
          html,
        });
      }),
    );

    for (const result of results) {
      if (result.status === "fulfilled" && !result.value?.error) {
        sent++;
      } else {
        const reason = result.reason || result.value?.error;
        console.error(
          "Failed to send to one recipient:",
          reason?.message || reason,
        );
        failed++;
      }
    }

    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return { sent, failed };
};

// ── sendInvoiceEmail ────────────────────────────────────────
export const sendInvoiceEmail = async (order, items) => {
  try {
    const [template, siteSettings] = await Promise.all([
      getTemplate("payment_success"),
      getSiteSettings(),
    ]);

    const variables = {
      buyer_name: escapeHtml(order.buyer_name),
      order_number: escapeHtml(order.order_number),
      total_amount: formatCurrency(order.total_amount),
      site_name: escapeHtml(siteSettings.site_name || "CompanyName"),
      header_color: template.header_color,
    };

    const pdfBuffer = await generateInvoiceBuffer(order, items, siteSettings, 0);
    const base64Pdf = pdfBuffer.toString("base64");

    const subject = `Invoice Tagihan ${order.order_number}`;

    const contentHtml = `
      <div style="background:#f8fafc;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
        <p style="color:#64748b;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Nomor Invoice</p>
        <p style="color:#0f172a;font-size:22px;font-weight:800;margin:0;letter-spacing:2px;font-family:monospace;">
          ${escapeHtml(order.order_number)}
        </p>
      </div>
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Terlampir adalah invoice resmi untuk pembayaran Anda. Mohon simpan email ini atau unduh file PDF terlampir untuk arsip keuangan Anda.
      </p>
      <div style="text-align:center;margin-top:30px;">
        <p style="color:#94a3b8;font-size:13px;margin:0;">Detail lengkap dapat dilihat pada file PDF terlampir.</p>
      </div>`;

    const html = buildEmailHtml(template, contentHtml, variables);

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: order.buyer_email,
      subject,
      html,
      attachments: [
        {
          filename: `Invoice_${order.order_number}.pdf`,
          content: base64Pdf,
        },
      ],
    });

    if (error) throw error;
    console.log("Invoice email sent:", data?.id);
    return true;
  } catch (err) {
    console.error("sendInvoiceEmail error:", err);
    return false;
  }
};