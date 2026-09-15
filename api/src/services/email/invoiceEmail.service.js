// api/src/services/email/invoiceEmail.service.js
import { query } from "../../config/database.js";
import { mailer } from "../../config/mailer.js";
import { renderInvoiceEmail } from "../../templates/invoiceEmailTemplate.js";

export async function sendOrderInvoiceEmail(orderId) {
  // 1) check order + invoice_sent_at
  const [order] = await query(`SELECT * FROM orders WHERE id = ? LIMIT 1`, [orderId]);
  if (!order) throw new Error("Order not found");
  if (order.invoice_sent_at) {
    return { skipped: true, reason: "invoice_already_sent" };
  }

  // 2) fetch details
  const items = await query(
    `SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC`,
    [orderId]
  );
  const [address] = await query(
    `SELECT * FROM order_addresses WHERE order_id = ? LIMIT 1`,
    [orderId]
  );

  const toEmail = address?.email;
  if (!toEmail) throw new Error("Missing customer email");

  // 3) build HTML
  const html = renderInvoiceEmail({ order, items, address });

  // 4) send
  await mailer.sendMail({
    from: process.env.MAIL_FROM_EMAIL || "no-reply@example.com",
    to: toEmail,
    cc: process.env.MAIL_INVOICE_CC || undefined,
    subject: `Votre facture - Commande ${orderId}`,
    html,
  });

  // 5) mark sent
  await query(`UPDATE orders SET invoice_sent_at = NOW() WHERE id = ?`, [orderId]);

  return { sent: true };
}
