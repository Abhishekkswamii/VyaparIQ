"use strict";

const PDFDocument = require("pdfkit");

const BRAND_ORANGE = "#F97316";
const BRAND_DARK   = "#1C1C1E";
const GRAY         = "#6B7280";
const LIGHT_GRAY   = "#F3F4F6";
const TEXT_PRIMARY = "#111827";

/**
 * generateInvoicePdf(data) → Promise<Buffer>
 *
 * data shape:
 *  { invoiceId, orderId, orderDate, orderStatus, paymentMethod,
 *    user: { name, email },
 *    address: { name, phone, address, city, state?, pincode },
 *    items: [{ name, category, quantity, price, line_total }],
 *    subtotal, discount, total }
 */
function generateInvoicePdf(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: `Invoice ${data.invoiceId}`,
        Author: "VyaparIQ",
        Subject: `Order #${data.orderId}`,
      },
    });

    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end",  () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const W = doc.page.width - 100; // usable width
    const ml = 50;                  // left margin

    // ── Header ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 90).fill(BRAND_DARK);

    doc.fillColor("#FFFFFF")
       .font("Helvetica-Bold")
       .fontSize(22)
       .text("VyaparIQ", ml, 28);

    doc.fillColor(BRAND_ORANGE)
       .font("Helvetica")
       .fontSize(9)
       .text("Smart Budget Shopping", ml, 54);

    doc.fillColor("#FFFFFF")
       .font("Helvetica-Bold")
       .fontSize(24)
       .text("INVOICE", 0, 28, { align: "right", width: doc.page.width - ml });

    doc.fillColor("#AAAAAA")
       .font("Helvetica")
       .fontSize(9)
       .text(`# ${data.invoiceId}`, 0, 58, { align: "right", width: doc.page.width - ml });

    // ── Meta row ────────────────────────────────────────────────────────────
    let y = 110;

    const orderDate = new Date(data.orderDate).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });

    const metaItems = [
      ["Order ID",       `#${data.orderId}`],
      ["Date",           orderDate],
      ["Status",         (data.orderStatus || "confirmed").toUpperCase()],
      ["Payment",        data.paymentMethod === "cod" ? "Cash on Delivery" : data.paymentMethod],
    ];

    const colW = W / metaItems.length;
    metaItems.forEach(([label, value], i) => {
      const x = ml + i * colW;
      doc.fillColor(GRAY).font("Helvetica").fontSize(8).text(label, x, y);
      doc.fillColor(TEXT_PRIMARY).font("Helvetica-Bold").fontSize(10).text(value, x, y + 13);
    });

    // ── Divider ─────────────────────────────────────────────────────────────
    y += 38;
    doc.moveTo(ml, y).lineTo(ml + W, y).strokeColor("#E5E7EB").lineWidth(1).stroke();

    // ── Bill To / Ship To ───────────────────────────────────────────────────
    y += 16;
    const halfW = W / 2 - 10;

    doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(8).text("BILL TO", ml, y);
    doc.fillColor(TEXT_PRIMARY).font("Helvetica-Bold").fontSize(10).text(data.user.name || "Customer", ml, y + 13);
    doc.fillColor(GRAY).font("Helvetica").fontSize(9).text(data.user.email || "", ml, y + 26);

    doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(8).text("SHIP TO", ml + halfW + 10, y);
    const addr = data.address;
    const addrLine1 = addr.name || data.user.name;
    const addrLine2 = addr.phone;
    const addrLine3 = addr.address || addr.address_line1 || "";
    const addrLine4 = [addr.city, addr.state, addr.pincode].filter(Boolean).join(", ");

    doc.fillColor(TEXT_PRIMARY).font("Helvetica-Bold").fontSize(10).text(addrLine1, ml + halfW + 10, y + 13);
    doc.fillColor(GRAY).font("Helvetica").fontSize(9)
       .text([addrLine2, addrLine3, addrLine4].filter(Boolean).join("\n"), ml + halfW + 10, y + 26, { lineGap: 2 });

    // ── Items table ─────────────────────────────────────────────────────────
    y += 90;
    doc.moveTo(ml, y).lineTo(ml + W, y).strokeColor("#E5E7EB").lineWidth(1).stroke();
    y += 10;

    const colWidths = [
      Math.round(W * 0.36), // Item name
      Math.round(W * 0.16), // Category
      Math.round(W * 0.10), // Qty
      Math.round(W * 0.19), // Unit Price
      Math.round(W * 0.19), // Total
    ];
    // Cumulative x positions — each column starts where the previous ends
    const colXs = [];
    let cx = ml;
    for (const w of colWidths) { colXs.push(cx); cx += w; }

    // Header row
    doc.rect(ml, y, W, 20).fill(BRAND_DARK);
    const headers = ["ITEM", "CATEGORY", "QTY", "UNIT PRICE", "TOTAL"];
    headers.forEach((h, i) => {
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8)
         .text(h, colXs[i] + 4, y + 6, { width: colWidths[i] - 8, align: i >= 2 ? "right" : "left" });
    });
    y += 20;

    // Data rows
    const items = data.items || [];
    items.forEach((item, idx) => {
      const rowH = 22;
      if (idx % 2 === 0) doc.rect(ml, y, W, rowH).fill(LIGHT_GRAY);
      else doc.rect(ml, y, W, rowH).fill("#FFFFFF");

      const lineTotal = parseFloat(item.line_total || 0);
      const price     = parseFloat(item.price || 0);

      const rowData = [
        item.name,
        item.category || "—",
        String(item.quantity),
        `\u20B9${price.toFixed(2)}`,
        `\u20B9${lineTotal.toFixed(2)}`,
      ];

      rowData.forEach((val, i) => {
        doc.fillColor(TEXT_PRIMARY).font("Helvetica").fontSize(9)
           .text(val, colXs[i] + 4, y + 6, {
             width: colWidths[i] - 8,
             align: i >= 2 ? "right" : "left",
             ellipsis: true,
           });
      });
      y += rowH;
    });

    // ── Totals ───────────────────────────────────────────────────────────────
    y += 12;
    doc.moveTo(ml, y).lineTo(ml + W, y).strokeColor("#E5E7EB").lineWidth(1).stroke();
    y += 12;

    const rightX  = ml + W * 0.62;
    const rightW  = W * 0.38;
    const amountX = ml + W - 4;

    const addTotalRow = (label, value, bold = false, color = TEXT_PRIMARY) => {
      const font = bold ? "Helvetica-Bold" : "Helvetica";
      const size = bold ? 11 : 9;
      doc.fillColor(GRAY).font("Helvetica").fontSize(9).text(label, rightX, y);
      doc.fillColor(color).font(font).fontSize(size)
         .text(value, rightX, y, { width: rightW, align: "right" });
      y += bold ? 20 : 16;
    };

    addTotalRow("Subtotal", `\u20B9${parseFloat(data.subtotal || 0).toFixed(2)}`);
    addTotalRow("Discount", data.discount > 0 ? `-\u20B9${parseFloat(data.discount).toFixed(2)}` : "—");
    addTotalRow("Delivery", "FREE", false, "#16A34A");

    doc.moveTo(rightX, y).lineTo(amountX, y).strokeColor("#E5E7EB").lineWidth(0.5).stroke();
    y += 6;
    addTotalRow("TOTAL (incl. all taxes)", `\u20B9${parseFloat(data.total || 0).toFixed(2)}`, true, BRAND_ORANGE);

    // ── Footer ───────────────────────────────────────────────────────────────
    // Draw inline (not pinned to page bottom) to avoid triggering extra pages.
    y += 24;
    doc.rect(ml, y, W, 58).fill(BRAND_DARK);

    doc.fillColor(BRAND_ORANGE).font("Helvetica-Bold").fontSize(11)
       .text("Thank you for shopping with VyaparIQ!", ml, y + 12, { width: W, align: "center" });
    doc.fillColor("#AAAAAA").font("Helvetica").fontSize(8)
       .text("This is a computer-generated invoice and does not require a signature.", ml, y + 30, { width: W, align: "center" });
    doc.fillColor("#888888").font("Helvetica").fontSize(7)
       .text(`Generated on ${new Date().toLocaleString("en-IN")}`, ml, y + 44, { width: W, align: "center" });

    doc.end();
  });
}

module.exports = { generateInvoicePdf };
