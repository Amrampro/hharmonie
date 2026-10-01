import { query, getConnection } from "../config/database.js";
import { releaseTransaction } from "../utils/transaction.js";
import { sendOrderInvoiceEmail } from "./email/invoiceEmail.service.js";

export async function reconcileOrderPayment(session) {
  if (!["paid", "no_payment_required"].includes(session.payment_status)) return;
  let connection, committed = false, orderId;
  try {
    connection = await getConnection(); await connection.beginTransaction();
    const [[payment]] = await connection.execute("SELECT * FROM order_payments WHERE stripe_checkout_session_id = ? FOR UPDATE", [session.id]);
    if (!payment) throw new Error("Payment not found yet");
    orderId = payment.order_id;
    const [[order]] = await connection.execute("SELECT * FROM orders WHERE id = ? FOR UPDATE", [orderId]);
    if (!order || session.metadata?.order_id !== order.id || Number(session.amount_total) !== Number(order.total_amount) || String(session.currency).toUpperCase() !== order.currency.toUpperCase()) throw new Error("Payment amount or order mismatch");
    if (!["refunded", "cancelled"].includes(order.status)) {
      await connection.execute("UPDATE order_payments SET status = 'succeeded', stripe_payment_intent_id = COALESCE(stripe_payment_intent_id, ?) WHERE id = ? AND status <> 'refunded'", [typeof session.payment_intent === "string" ? session.payment_intent : null, payment.id]);
      await connection.execute("UPDATE orders SET status = 'paid' WHERE id = ? AND status IN ('pending_payment', 'pending')", [order.id]);
    }
    await connection.commit(); committed = true;
  } finally { await releaseTransaction(connection, committed); }
  // An SMTP failure is retryable, without undoing an already confirmed payment.
  await sendOrderInvoiceEmail(orderId);
}
