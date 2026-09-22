import Stripe from "stripe";
import { getConnection, query } from "../config/database.js";
import { releaseTransaction } from "../utils/transaction.js";

let client;
function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw Object.assign(new Error("Le paiement est temporairement indisponible."), { statusCode: 503 });
  return client ??= new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20", timeout: 15000, maxNetworkRetries: 1 });
}
export function priceInCents(value) {
  if (typeof value !== "number" && typeof value !== "string") throw Object.assign(new Error("Prix en euros invalide."), { statusCode: 400 });
  const text = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw Object.assign(new Error("Le prix doit être positif, avec deux décimales au maximum."), { statusCode: 400 });
  const cents = Math.round(Number(text) * 100);
  if (!Number.isSafeInteger(cents) || cents > 99999999 || (cents > 0 && cents < 50)) throw Object.assign(new Error("Indiquez 0 € (gratuit) ou un prix d’au moins 0,50 €."), { statusCode: 400 });
  return cents;
}
export async function createAppointmentCheckout(number, email, cents) {
  const origin = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",")[0].trim().replace(/\/$/, "");
  return stripe().checkout.sessions.create({
    mode: "payment", payment_method_types: ["card"], customer_email: email,
    metadata: { kind: "appointment", appointment_number: number },
    line_items: [{ quantity: 1, price_data: { currency: "eur", unit_amount: cents, product_data: { name: "Réservation de consultation" } } }],
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    success_url: `${origin}/consultation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/consultation?payment=cancelled`,
    locale: "fr",
  }, { idempotencyKey: number });
}
export async function expireAppointmentCheckout(id) { return stripe().checkout.sessions.expire(id); }

// Used both by signed webhooks and by server-side retrieval on return from Checkout.
export async function reconcileAppointmentPayment(session) {
  if (session.metadata?.kind !== "appointment") return;
  const [found] = await query("SELECT slot_id FROM appointments WHERE stripe_session_id = ?", [session.id]);
  if (!found) throw new Error("Appointment session not yet persisted");
  let connection, committed = false;
  try {
    connection = await getConnection();
    await connection.beginTransaction();
    await connection.execute("SELECT id FROM appointment_slots WHERE id = ? FOR UPDATE", [found.slot_id]);
    const [[appointment]] = await connection.execute("SELECT * FROM appointments WHERE stripe_session_id = ? FOR UPDATE", [session.id]);
    if (!appointment || appointment.appointment_number !== session.metadata.appointment_number || Number(session.amount_total) !== Number(appointment.amount_cents) || session.currency !== "eur") throw new Error("Appointment payment mismatch");
    if (appointment.payment_status === "pending") {
      if (session.payment_status === "paid") {
        await connection.execute("UPDATE appointments SET status = 'confirmed', payment_status = 'paid' WHERE id = ?", [appointment.id]);
      } else if (session.status === "expired") {
        await connection.execute("UPDATE appointments SET status = 'payment_expired', payment_status = 'expired' WHERE id = ?", [appointment.id]);
        await connection.execute("UPDATE appointment_slots SET status = 'available' WHERE id = ? AND status = 'booked'", [appointment.slot_id]);
      }
    }
    await connection.commit(); committed = true;
  } finally { await releaseTransaction(connection, committed); }
}
export async function refreshExpiredAppointmentPayments(slotId) {
  const rows = await query(`SELECT stripe_session_id FROM appointments WHERE payment_status = 'pending' AND payment_expires_at <= UNIX_TIMESTAMP()${slotId ? " AND slot_id = ?" : ""} ORDER BY payment_expires_at LIMIT 20`, slotId ? [slotId] : []);
  for (const row of rows) {
    // Never free a slot on the local clock alone: a payment may have succeeded.
    try { await reconcileAppointmentPayment(await stripe().checkout.sessions.retrieve(row.stripe_session_id)); }
    catch (error) { console.error("Appointment payment reconciliation failed:", error.code || error.type || "unavailable"); }
  }
}
export async function getAppointmentPayment(sessionId) {
  const [record] = await query("SELECT appointment_number, status, payment_status FROM appointments WHERE stripe_session_id = ?", [sessionId]);
  if (!record) throw Object.assign(new Error("Paiement introuvable."), { statusCode: 404 });
  const session = await stripe().checkout.sessions.retrieve(sessionId);
  await reconcileAppointmentPayment(session);
  const [updated] = await query("SELECT appointment_number, status, payment_status FROM appointments WHERE stripe_session_id = ?", [sessionId]);
  return { ...updated, checkout_url: session.status === "open" ? session.url : null };
}
