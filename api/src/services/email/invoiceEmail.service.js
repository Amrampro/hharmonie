import { randomBytes } from "node:crypto";
import { query } from "../../config/database.js";
import { mailer } from "../../config/mailer.js";
import { renderInvoiceEmail } from "../../templates/invoiceEmailTemplate.js";
import { publicSiteUrl, orderTrackingUrl } from "../../utils/publicSite.js";

export async function sendOrderInvoiceEmail(orderId) {
  const [order] = await query("SELECT * FROM orders WHERE id = ? LIMIT 1", [orderId]);
  if (!order) throw new Error("Order not found");
  if (order.invoice_sent_at) return { skipped: true, reason: "invoice_already_sent" };
  if (!["paid", "processing", "shipped", "delivered", "completed"].includes(order.status)) return { skipped: true, reason: "order_not_paid" };
  const claim = await query(`UPDATE orders SET invoice_send_started_at = NOW() WHERE id = ? AND invoice_sent_at IS NULL AND (invoice_send_started_at IS NULL OR invoice_send_started_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE))`, [orderId]);
  if (!claim.affectedRows) throw new Error("Invoice delivery already in progress; retry later");
  try {
    const items = await query("SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC", [orderId]);
    const [address] = await query("SELECT * FROM order_addresses WHERE order_id = ? LIMIT 1", [orderId]);
    const [company] = await query("SELECT * FROM parameters ORDER BY created_at ASC LIMIT 1");
    if (!address?.email) throw new Error("Missing customer email");
    if (!order.tracking_token) {
      const token = randomBytes(32).toString("hex");
      await query("UPDATE orders SET tracking_token = COALESCE(tracking_token, ?) WHERE id = ?", [token, orderId]);
      const [saved] = await query("SELECT tracking_token FROM orders WHERE id = ?", [orderId]);
      order.tracking_token = saved.tracking_token;
    }
    const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER;
    if (!fromEmail) throw new Error("MAIL_FROM_EMAIL is required");
    const orderUrl = orderTrackingUrl(order);
    await mailer.sendMail({
      from: { name: company?.name || process.env.MAIL_FROM_NAME || "Hormones & Harmonie", address: fromEmail },
      replyTo: company?.email || fromEmail,
      to: address.email,
      cc: process.env.MAIL_INVOICE_CC || undefined,
      subject: `Confirmation de commande — ${company?.name || "Hormones & Harmonie"} — ${order.order_number || order.id}`,
      html: renderInvoiceEmail({ order, items, address, company, orderUrl, siteUrl: publicSiteUrl() }),
      text: `Merci pour votre commande. Votre paiement est confirmé. Référence : ${order.order_number || order.id}. Suivi : ${orderUrl}`,
    });
    await query("UPDATE orders SET invoice_sent_at = NOW(), invoice_send_started_at = NULL WHERE id = ?", [orderId]);
    return { sent: true };
  } catch (error) {
    await query("UPDATE orders SET invoice_send_started_at = NULL WHERE id = ? AND invoice_sent_at IS NULL", [orderId]);
    throw error;
  }
}
