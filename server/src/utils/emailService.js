import { Resend } from "resend";
import supabase from "../config/supabase.js";

const resend = new Resend(process.env.RESEND_API_KEY);

// ============================================================
// RENDER ENGINE — ganti {{variable}} dengan nilai nyata
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

    <div style="background:${headerColor};padding:36px 32px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">
        ${variables.site_name || "CompanyName"}
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
// CONTENT HTML PER TEMPLATE TYPE
// ============================================================
const buildOrderCreatedContent = (order, items, variables) => {
  const trackUrl = `${process.env.CLIENT_URL}/order/${order.order_number}`;

  return `
    <div style="background:#eff6ff;border:2px dashed #93c5fd;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <p style="color:#64748b;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">
        Nomor Order
      </p>
      <p style="color:#1d4ed8;font-size:22px;font-weight:800;margin:0;letter-spacing:2px;font-family:monospace;">
        ${order.order_number}
      </p>
    </div>

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
            <td style="padding:10px;color:#334155;font-size:13px;border-bottom:1px solid #f1f5f9;">${item.product_name}</td>
            <td style="padding:10px;color:#334155;font-size:13px;text-align:center;border-bottom:1px solid #f1f5f9;">${item.quantity}</td>
            <td style="padding:10px;color:#334155;font-size:13px;text-align:right;border-bottom:1px solid #f1f5f9;">${formatCurrency(item.price_at_purchase * item.quantity)}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:10px;font-weight:700;font-size:14px;color:#0f172a;">Total</td>
          <td style="padding:10px;font-weight:800;font-size:16px;text-align:right;color:#1d4ed8;">${formatCurrency(order.total_amount)}</td>
        </tr>
      </tfoot>
    </table>

    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px;margin-bottom:20px;">
      <p style="color:#92400e;font-size:13px;margin:0;">
        ⚠️ Segera selesaikan pembayaran sebelum batas waktu yang ditentukan.
      </p>
    </div>

    <div style="text-align:center;">
      <a href="${trackUrl}" style="display:inline-block;background:${variables.header_color || "#2563eb"};color:white;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:600;font-size:14px;">
        Lacak Status Pesanan
      </a>
    </div>`;
};

const buildPaymentSuccessContent = (order, items, variables) => {
  const trackUrl = `${process.env.CLIENT_URL}/order/${order.order_number}`;

  return `
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div>
          <p style="color:#64748b;font-size:11px;margin:0;text-transform:uppercase;letter-spacing:1px;">Nomor Order</p>
          <p style="color:#15803d;font-size:16px;font-weight:800;margin:4px 0 0;font-family:monospace;">${order.order_number}</p>
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
          Metode: <strong style="color:#15803d;">${order.midtrans_payment_type.replace(/_/g, " ")}</strong>
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
        📦 <strong>Estimasi penyelesaian:</strong> ${variables.delivery_estimation}
      </p>
    </div>`
        : ""
    }

    <h3 style="color:#0f172a;font-size:15px;margin:0 0 10px;">Item yang Dibeli</h3>
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
            <td style="padding:10px;color:#334155;font-size:13px;border-bottom:1px solid #f1f5f9;">${item.product_name}</td>
            <td style="padding:10px;color:#334155;font-size:13px;text-align:center;border-bottom:1px solid #f1f5f9;">${item.quantity}</td>
            <td style="padding:10px;color:#334155;font-size:13px;text-align:right;border-bottom:1px solid #f1f5f9;">${formatCurrency(item.price_at_purchase * item.quantity)}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:10px;font-weight:700;font-size:14px;color:#0f172a;">Total</td>
          <td style="padding:10px;font-weight:800;font-size:16px;text-align:right;color:#059669;">${formatCurrency(order.total_amount)}</td>
        </tr>
      </tfoot>
    </table>

    <div style="text-align:center;">
      <a href="${trackUrl}" style="display:inline-block;background:${variables.header_color || "#059669"};color:white;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:600;font-size:14px;">
        Lihat Detail Pesanan
      </a>
    </div>`;
};

// ============================================================
// SEND FUNCTIONS
// ============================================================
export const sendOrderCreatedEmail = async (order, items) => {
  try {
    const [template, siteSettings] = await Promise.all([
      getTemplate("order_created"),
      getSiteSettings(),
    ]);

    const variables = {
      buyer_name: order.buyer_name,
      order_number: order.order_number,
      total_amount: formatCurrency(order.total_amount),
      order_date: formatDate(order.created_at),
      site_name: siteSettings.site_name || "CompanyName",
      track_url: `${process.env.CLIENT_URL}/order/${order.order_number}`,
      delivery_estimation: siteSettings.delivery_estimation || "",
      header_color: template.header_color,
    };

    const subject = renderTemplate(template.subject, variables);
    const contentHtml = buildOrderCreatedContent(order, items, variables);
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

export const sendPaymentSuccessEmail = async (order, items) => {
  try {
    const [template, siteSettings] = await Promise.all([
      getTemplate("payment_success"),
      getSiteSettings(),
    ]);

    const variables = {
      buyer_name: order.buyer_name,
      order_number: order.order_number,
      total_amount: formatCurrency(order.total_amount),
      payment_method: order.midtrans_payment_type?.replace(/_/g, " ") || "",
      paid_at: order.paid_at ? formatDate(order.paid_at) : "",
      site_name: siteSettings.site_name || "CompanyName",
      track_url: `${process.env.CLIENT_URL}/order/${order.order_number}`,
      delivery_estimation: siteSettings.delivery_estimation || "",
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

export const sendBroadcastEmail = async (broadcast, recipients) => {
  if (!recipients.length) return { sent: 0, failed: 0 };

  const siteSettings = await getSiteSettings();
  let sent = 0;
  let failed = 0;

  // Kirim batch per 50 agar tidak hit rate limit Resend
  const batchSize = 50;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    const emails = batch.map((recipient) => {
      const variables = {
        buyer_name: recipient.buyer_name,
        site_name: siteSettings.site_name || "CompanyName",
      };

      const subject = renderTemplate(broadcast.subject, variables);
      const body = renderTemplate(broadcast.body_message, variables);

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
    <div style="background:#2563eb;padding:32px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:20px;">${variables.site_name}</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#334155;font-size:15px;margin:0 0 16px;">Halo ${variables.buyer_name},</p>
      <div style="color:#475569;font-size:15px;line-height:1.7;">${body.replace(/\n/g, "<br>")}</div>
    </div>
    <div style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">
        Email ini dikirim oleh ${variables.site_name}. 
        Anda menerima email ini karena pernah berbelanja di website kami.
      </p>
    </div>
  </div>
</body>
</html>`;

      return {
        from: process.env.RESEND_FROM_EMAIL,
        to: recipient.buyer_email,
        subject,
        html,
      };
    });

    try {
      await resend.batch.send(emails);
      sent += batch.length;
    } catch (err) {
      console.error(`Batch ${i / batchSize + 1} failed:`, err);
      failed += batch.length;
    }

    // Delay antar batch untuk hindari rate limit
    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return { sent, failed };
};
