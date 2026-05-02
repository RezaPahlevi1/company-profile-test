import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
// EMAIL TEMPLATE — ORDER CREATED
// ============================================================
const orderCreatedTemplate = (order, items) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Konfirmasi Order</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:40px 32px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:24px;font-weight:700;">
        Order Berhasil Dibuat! 🎉
      </h1>
      <p style="color:#bfdbfe;margin:8px 0 0;font-size:15px;">
        Selesaikan pembayaran untuk memproses pesanan Anda
      </p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="color:#475569;font-size:15px;margin:0 0 24px;">
        Halo <strong style="color:#0f172a;">${order.buyer_name}</strong>,
      </p>
      <p style="color:#475569;font-size:15px;margin:0 0 24px;">
        Terima kasih telah melakukan pemesanan. Berikut adalah detail pesanan Anda:
      </p>

      <!-- Order Number Box -->
      <div style="background:#eff6ff;border:2px dashed #93c5fd;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
        <p style="color:#64748b;font-size:13px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">
          Nomor Order Anda
        </p>
        <p style="color:#1d4ed8;font-size:24px;font-weight:800;margin:0;letter-spacing:2px;font-family:monospace;">
          ${order.order_number}
        </p>
        <p style="color:#94a3b8;font-size:12px;margin:8px 0 0;">
          Simpan nomor ini untuk melacak status pesanan Anda
        </p>
      </div>

      <!-- Order Items -->
      <h3 style="color:#0f172a;font-size:16px;margin:0 0 12px;">Item Pesanan</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="text-align:left;padding:10px 12px;color:#64748b;font-size:13px;border-bottom:1px solid #e2e8f0;">Produk</th>
            <th style="text-align:center;padding:10px 12px;color:#64748b;font-size:13px;border-bottom:1px solid #e2e8f0;">Qty</th>
            <th style="text-align:right;padding:10px 12px;color:#64748b;font-size:13px;border-bottom:1px solid #e2e8f0;">Harga</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item) => `
            <tr>
              <td style="padding:12px;color:#334155;font-size:14px;border-bottom:1px solid #f1f5f9;">
                ${item.product_name}
              </td>
              <td style="padding:12px;color:#334155;font-size:14px;text-align:center;border-bottom:1px solid #f1f5f9;">
                ${item.quantity}
              </td>
              <td style="padding:12px;color:#334155;font-size:14px;text-align:right;border-bottom:1px solid #f1f5f9;">
                ${formatCurrency(item.price_at_purchase * item.quantity)}
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px;color:#0f172a;font-weight:700;font-size:15px;">Total</td>
            <td style="padding:12px;color:#2563eb;font-weight:800;font-size:18px;text-align:right;">
              ${formatCurrency(order.total_amount)}
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- Buyer Info -->
      <h3 style="color:#0f172a;font-size:16px;margin:0 0 12px;">Informasi Pembeli</h3>
      <table style="width:100%;margin-bottom:24px;">
        ${[
          ["Nama", order.buyer_name],
          ["Email", order.buyer_email],
          ["Nomor HP", order.buyer_phone],
          ["Alamat", order.buyer_address],
          ["Tanggal Order", formatDate(order.created_at)],
        ]
          .map(
            ([label, value]) => `
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:14px;width:120px;">${label}</td>
            <td style="padding:6px 0;color:#334155;font-size:14px;">: ${value}</td>
          </tr>
        `,
          )
          .join("")}
      </table>

      <!-- CTA -->
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="color:#92400e;font-size:14px;margin:0;">
          ⚠️ <strong>Segera selesaikan pembayaran Anda.</strong> Order akan otomatis dibatalkan jika pembayaran tidak diselesaikan dalam 24 jam.
        </p>
      </div>

      <!-- Track Order -->
      <div style="text-align:center;">
        <a href="${process.env.CLIENT_URL}/order/${order.order_number}"
          style="display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:15px;">
          Lacak Status Pesanan
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:13px;margin:0;">
        Email ini dikirim otomatis. Jika ada pertanyaan, hubungi kami di
        <a href="mailto:email@company.com" style="color:#2563eb;">email@company.com</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

// ============================================================
// EMAIL TEMPLATE — PAYMENT SUCCESS
// ============================================================
const paymentSuccessTemplate = (order, items) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pembayaran Berhasil</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#065f46,#059669);padding:40px 32px;text-align:center;">
      <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
        <span style="font-size:32px;">✅</span>
      </div>
      <h1 style="color:white;margin:0;font-size:24px;font-weight:700;">
        Pembayaran Berhasil!
      </h1>
      <p style="color:#a7f3d0;margin:8px 0 0;font-size:15px;">
        Terima kasih atas kepercayaan Anda
      </p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="color:#475569;font-size:15px;margin:0 0 24px;">
        Halo <strong style="color:#0f172a;">${order.buyer_name}</strong>,
      </p>
      <p style="color:#475569;font-size:15px;margin:0 0 24px;">
        Pembayaran Anda telah kami terima dan dikonfirmasi. Berikut ringkasan transaksi Anda:
      </p>

      <!-- Success Box -->
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <p style="color:#64748b;font-size:12px;margin:0;text-transform:uppercase;letter-spacing:1px;">
              Nomor Order
            </p>
            <p style="color:#15803d;font-size:18px;font-weight:800;margin:4px 0 0;font-family:monospace;">
              ${order.order_number}
            </p>
          </div>
          <div style="text-align:right;">
            <p style="color:#64748b;font-size:12px;margin:0;text-transform:uppercase;letter-spacing:1px;">
              Total Dibayar
            </p>
            <p style="color:#15803d;font-size:20px;font-weight:800;margin:4px 0 0;">
              ${formatCurrency(order.total_amount)}
            </p>
          </div>
        </div>
        ${
          order.midtrans_payment_type
            ? `
          <p style="color:#64748b;font-size:13px;margin:12px 0 0;padding-top:12px;border-top:1px solid #bbf7d0;">
            Metode Pembayaran: <strong style="color:#15803d;">${order.midtrans_payment_type.replace(/_/g, " ")}</strong>
            ${order.paid_at ? ` · ${formatDate(order.paid_at)}` : ""}
          </p>
        `
            : ""
        }
      </div>

      <!-- Items -->
      <h3 style="color:#0f172a;font-size:16px;margin:0 0 12px;">Item yang Dibeli</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="text-align:left;padding:10px 12px;color:#64748b;font-size:13px;border-bottom:1px solid #e2e8f0;">Produk</th>
            <th style="text-align:center;padding:10px 12px;color:#64748b;font-size:13px;border-bottom:1px solid #e2e8f0;">Qty</th>
            <th style="text-align:right;padding:10px 12px;color:#64748b;font-size:13px;border-bottom:1px solid #e2e8f0;">Harga</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item) => `
            <tr>
              <td style="padding:12px;color:#334155;font-size:14px;border-bottom:1px solid #f1f5f9;">
                ${item.product_name}
              </td>
              <td style="padding:12px;color:#334155;font-size:14px;text-align:center;border-bottom:1px solid #f1f5f9;">
                ${item.quantity}
              </td>
              <td style="padding:12px;color:#334155;font-size:14px;text-align:right;border-bottom:1px solid #f1f5f9;">
                ${formatCurrency(item.price_at_purchase * item.quantity)}
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px;color:#0f172a;font-weight:700;font-size:15px;">Total</td>
            <td style="padding:12px;color:#059669;font-weight:800;font-size:18px;text-align:right;">
              ${formatCurrency(order.total_amount)}
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- Track -->
      <div style="text-align:center;">
        <a href="${process.env.CLIENT_URL}/order/${order.order_number}"
          style="display:inline-block;background:linear-gradient(135deg,#059669,#065f46);color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:15px;">
          Lihat Detail Pesanan
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:13px;margin:0;">
        Terima kasih telah berbelanja di CompanyName.
        Pertanyaan? Hubungi <a href="mailto:email@company.com" style="color:#2563eb;">email@company.com</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

// ============================================================
// SEND FUNCTIONS
// ============================================================
export const sendOrderCreatedEmail = async (order, items) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: order.buyer_email,
      subject: `✅ Order ${order.order_number} Berhasil Dibuat — Selesaikan Pembayaran`,
      html: orderCreatedTemplate(order, items),
    });

    if (error) {
      console.error("Email send error (order created):", error);
      return false;
    }

    console.log("Order created email sent:", data?.id);
    return true;
  } catch (err) {
    console.error("Email service error:", err);
    return false;
  }
};

export const sendPaymentSuccessEmail = async (order, items) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: order.buyer_email,
      subject: `🎉 Pembayaran ${order.order_number} Berhasil Dikonfirmasi`,
      html: paymentSuccessTemplate(order, items),
    });

    if (error) {
      console.error("Email send error (payment success):", error);
      return false;
    }

    console.log("Payment success email sent:", data?.id);
    return true;
  } catch (err) {
    console.error("Email service error:", err);
    return false;
  }
};
