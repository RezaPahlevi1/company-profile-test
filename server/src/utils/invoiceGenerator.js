import PDFDocument from "pdfkit";

const formatCurrency = (amount) =>
  `Rp ${Number(amount).toLocaleString("id-ID")}`;

const formatDate = (date) =>
  new Date(date).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

/**
 * Generate Invoice PDF sebagai Buffer
 * @param {Object} order - Data order dari database
 * @param {Array} items - Array order_items
 * @param {Object} siteSettings - Site settings dari database
 * @param {Number} adminFee - Biaya administrasi (default 0)
 * @returns {Promise<Buffer>}
 */
export const generateInvoiceBuffer = async (
  order,
  items,
  siteSettings,
  adminFee = 0,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // === FETCH LOGO ===
      const logoUrl = siteSettings.navbar_logo_url;
      let logoBuffer = null;

      if (logoUrl) {
        try {
          const response = await fetch(logoUrl);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            logoBuffer = Buffer.from(arrayBuffer);
          }
        } catch (e) {
          console.warn("Gagal fetch logo untuk invoice, menggunakan teks.");
        }
      }

      // === HEADER ===
      const logoHeight = 60;
      if (logoBuffer) {
        doc.image(logoBuffer, 50, 45, { height: logoHeight });
      } else {
        doc
          .fontSize(20)
          .fillColor("#0f172a")
          .font("Helvetica-Bold")
          .text(siteSettings.site_name || "CompanyName", 50, 50);
      }

      const headerTextX = 50;
      let headerTextY = logoBuffer ? 45 + logoHeight + 5 : 80;

      doc
        .fontSize(10)
        .fillColor("#64748b")
        .font("Helvetica")
        .text(siteSettings.company_address || "", headerTextX, headerTextY, {
          width: 300,
        });

      doc.text(
        `Telp: ${siteSettings.whatsapp_number || "-"}`,
        headerTextX,
        headerTextY + 30,
      );

      // === INFO INVOICE (KANAN ATAS) ===
      const invoiceInfoX = 350;
      let invoiceInfoY = 50;

      doc
        .fontSize(20)
        .fillColor("#0f172a")
        .font("Helvetica-Bold")
        .text("INVOICE", invoiceInfoX, invoiceInfoY);

      doc
        .fontSize(10)
        .fillColor("#64748b")
        .font("Helvetica")
        .text(`#${order.order_number}`, invoiceInfoX, invoiceInfoY + 25);

      // Status Badge
      doc
        .fillColor("#059669")
        .font("Helvetica-Bold")
        .text("PAID", invoiceInfoX, invoiceInfoY + 45);

      doc
        .fillColor("#64748b")
        .font("Helvetica")
        .text(
          `Tanggal: ${formatDate(order.paid_at || order.created_at)}`,
          invoiceInfoX,
          invoiceInfoY + 65,
        );

      // === INVOICED TO ===
      let buyerBlockY = 200;
      doc
        .fontSize(9)
        .fillColor("#94a3b8")
        .font("Helvetica-Bold")
        .text("INVOICED TO", 50, buyerBlockY);

      doc
        .fontSize(11)
        .fillColor("#0f172a")
        .font("Helvetica-Bold")
        .text(order.buyer_name, 50, buyerBlockY + 15);

      doc
        .fontSize(10)
        .fillColor("#475569")
        .font("Helvetica")
        .text(order.buyer_email, 50, buyerBlockY + 32)
        .text(order.buyer_phone, 50, buyerBlockY + 46)
        .text(order.buyer_address, 50, buyerBlockY + 60, { width: 250 });

      // === TABEL ITEMS ===
      const tableTopY = buyerBlockY + 120;
      const itemColX = 50;
      const totalColX = 400;

      // Header tabel
      doc.fillColor("#f8fafc").rect(itemColX, tableTopY, 500, 25).fill();

      doc
        .fillColor("#64748b")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Description", itemColX + 10, tableTopY + 8)
        .text("Total", totalColX + 10, tableTopY + 8);

      // Baris Items
      let currentY = tableTopY + 25;
      doc.font("Helvetica").fontSize(10).fillColor("#334155");

      items.forEach((item) => {
        doc
          .text(
            `${item.product_name} (Qty: ${item.quantity})`,
            itemColX + 10,
            currentY + 8,
          )
          .text(
            formatCurrency(item.price_at_purchase * item.quantity),
            totalColX + 10,
            currentY + 8,
          );

        currentY += 30;
        doc
          .moveTo(itemColX, currentY)
          .lineTo(itemColX + 500, currentY)
          .strokeColor("#e2e8f0")
          .stroke();
      });

      // Biaya Administrasi (Scalable)
      if (adminFee > 0) {
        doc
          .fillColor("#334155")
          .text("Biaya Administrasi", itemColX + 10, currentY + 8)
          .text(formatCurrency(adminFee), totalColX + 10, currentY + 8);
        currentY += 30;
        doc
          .moveTo(itemColX, currentY)
          .lineTo(itemColX + 500, currentY)
          .strokeColor("#e2e8f0")
          .stroke();
      }

      // === TOTAL ===
      const subTotal = items.reduce(
        (sum, item) => sum + item.price_at_purchase * item.quantity,
        0,
      );
      const totalAmount = subTotal + adminFee;

      doc
        .fontSize(10)
        .fillColor("#64748b")
        .text("Sub Total", itemColX + 10, currentY + 15)
        .text(formatCurrency(subTotal), totalColX + 10, currentY + 15);

      currentY += 35;

      doc
        .fontSize(12)
        .fillColor("#0f172a")
        .font("Helvetica-Bold")
        .text("Total", itemColX + 10, currentY)
        .fillColor("#059669")
        .text(formatCurrency(totalAmount), totalColX + 10, currentY);

      // === FOOTER ===
      const footerY = 750;
      doc
        .fontSize(9)
        .fillColor("#94a3b8")
        .font("Helvetica")
        .text(
          "Email ini dikirim otomatis oleh sistem. Mohon simpan invoice ini untuk arsip Anda.",
          50,
          footerY,
          { align: "center", width: 500 },
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
