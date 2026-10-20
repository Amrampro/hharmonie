import PDFDocument from "pdfkit";
import { Buffer } from "node:buffer";

// All amounts are stored in cents. Do not add tax rates absent from the order.
export function renderInvoicePdf({ order, items, address }, company = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 45, bufferPages: true, info: { Title: `Facture — ${order.order_number || order.id}`, Author: company.name || "Hormones & Harmonie" } });
    const chunks = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    const ink = "#253D32", rose = "#A47788";
    const money = value => (Number(value) / 100).toFixed(2).replace(".", ",") + " EUR";
    const text = (value, x, y, options = {}) => doc.text(String(value ?? ""), x, y, options);
    let y = 45;
    doc.fillColor(ink).font("Helvetica-Bold").fontSize(22);
    text(company.name || "Hormones & Harmonie", 45, y, { width: 505 }); y = doc.y + 12;
    doc.font("Helvetica").fontSize(9).fillColor("#555555");
    text([company.address, company.email, company.phone, company.enterprise_number && `N° d’entreprise : ${company.enterprise_number}`].filter(Boolean).join("\n"), 45, y, { width: 505 }); y = doc.y + 25;
    doc.fillColor(rose).font("Helvetica-Bold").fontSize(26);
    text("FACTURE", 45, y); y = doc.y + 10;
    doc.fillColor(ink).font("Helvetica").fontSize(10);
    text(`Référence de commande : ${order.order_number || order.id}`, 45, y, { width: 505 }); y = doc.y + 6;
    text(`Date : ${new Date(order.created_at).toLocaleDateString("fr-BE")}   •   Devise : ${order.currency || "EUR"}`, 45, y); y = doc.y + 18;
    doc.font("Helvetica-Bold"); text("CLIENT / LIVRAISON", 45, y); y = doc.y + 7;
    doc.font("Helvetica");
    text([address?.full_name, address?.email, address?.address1, address?.address2, `${address?.postal_code || ""} ${address?.city || ""}`, address?.country].filter(Boolean).join("\n"), 45, y, { width: 505 }); y = doc.y + 22;
    const tableHeader = () => {
      doc.rect(45, y, 505, 27).fill(ink);
      doc.fillColor("white").font("Helvetica-Bold").fontSize(9);
      text("ARTICLE", 55, y + 9, { width: 245 });
      text("QTÉ", 310, y + 9, { width: 35, align: "right" });
      text("PRIX UNITAIRE", 350, y + 9, { width: 90, align: "right" });
      text("MONTANT", 445, y + 9, { width: 95, align: "right" });
      y += 36;
    };
    const page = () => { doc.addPage(); y = 45; };
    if (y > 650) page();
    tableHeader();
    for (const item of items) {
      doc.font("Helvetica").fontSize(10);
      const height = Math.max(24, doc.heightOfString(item.product_name, { width: 245 }) + 18);
      if (y + height > 735) { page(); tableHeader(); }
      doc.fillColor(ink).font("Helvetica").fontSize(10);
      text(item.product_name, 55, y, { width: 245 });
      text(item.quantity, 310, y, { width: 35, align: "right" });
      text(money(item.unit_price), 350, y, { width: 90, align: "right" });
      text(money(item.line_total), 445, y, { width: 95, align: "right" });
      y += height;
      doc.moveTo(45, y - 9).lineTo(550, y - 9).strokeColor("#E8DDDF").stroke();
    }
    if (y + 160 > 735) page();
    y += 12;
    for (const [label, value] of [["Sous-total", order.subtotal_amount], ["Réduction", -order.discount_amount], ["Livraison", order.shipping_amount], ["TOTAL", order.total_amount]]) {
      const total = label === "TOTAL";
      if (total) doc.rect(300, y - 7, 250, 31).fill("#F3ECEF");
      doc.fillColor(ink).font(total ? "Helvetica-Bold" : "Helvetica").fontSize(total ? 12 : 10);
      text(label, 310, y, { width: 120 }); text(money(value), 435, y, { width: 105, align: "right" }); y += 29;
    }
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.font("Helvetica").fontSize(8).fillColor("#777777");
      text(`Merci pour votre confiance.                                      Page ${i + 1} / ${range.count}`, 45, 777, { width: 505, lineBreak: false });
    }
    doc.end();
  });
}
