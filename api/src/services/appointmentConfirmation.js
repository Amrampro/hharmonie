import { query } from "../config/database.js";
import { mailer } from "../config/mailer.js";
import { publicSiteUrl } from "../utils/publicSite.js";
import { URL } from "node:url";

export const platformLabels = { default: "Maintenir le lien par défaut", whatsapp: "WhatsApp", google_meet: "Google Meet", zoom: "Zoom" };
const typeLabels = { online: "En ligne", physical: "Présentiel", phone: "Téléphone", hybrid: "Hybride" };
const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export function meetingUrl(value) {
  if (value == null || value === "") return null;
  try {
    if (typeof value !== "string" || value.length > 1000) throw new Error();
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) throw new Error();
    return url.href;
  } catch { throw Object.assign(new Error("Le lien de réunion doit être une adresse HTTPS valide."), { statusCode: 400 }); }
}
export function confirmationUrl(token) {
  return `${publicSiteUrl()}/consultation/confirmation?token=${encodeURIComponent(token)}`;
}
export async function readConfirmation(token) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) throw Object.assign(new Error("Confirmation introuvable."), { statusCode: 404 });
  const [appointment] = await query(`SELECT a.appointment_number, a.first_name, a.last_name, a.email, a.phone,
    a.status, a.payment_status, a.amount_cents, a.platform_preference, a.meeting_url, a.confirmation_sent_at,
    sv.name AS service_name, sv.short_description, sv.description, sv.duration_minutes, sv.meeting_type,
    DATE_FORMAT(s.available_date, '%Y-%m-%d') AS available_date, s.start_time, s.end_time
    FROM appointments a JOIN appointment_services sv ON sv.id = a.service_id
    JOIN appointment_slots s ON s.id = a.slot_id WHERE a.confirmation_token = ?`, [token]);
  if (!appointment) throw Object.assign(new Error("Confirmation introuvable."), { statusCode: 404 });
  // Meeting details are only returned after the server has confirmed the reservation.
  if (!["paid", "free"].includes(appointment.payment_status)) return { payment_status: appointment.payment_status, status: appointment.status };
  return appointment;
}
export async function sendAppointmentConfirmation(number) {
  const [record] = await query("SELECT id, confirmation_token, confirmation_sent_at, payment_status FROM appointments WHERE appointment_number = ?", [number]);
  if (!record || !record.confirmation_token || record.confirmation_sent_at || !["paid", "free"].includes(record.payment_status)) return;
  const claim = await query(`UPDATE appointments SET confirmation_send_started_at = NOW() WHERE id = ? AND confirmation_sent_at IS NULL
    AND (confirmation_send_started_at IS NULL OR confirmation_send_started_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE))`, [record.id]);
  if (!claim.affectedRows) return;
  try {
    const a = await readConfirmation(record.confirmation_token);
    const [company] = await query("SELECT name, email, phone, address, enterprise_number FROM parameters ORDER BY created_at ASC LIMIT 1");
    const from = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER;
    if (!from) throw new Error("MAIL_FROM_EMAIL is required");
    const name = company?.name || process.env.MAIL_FROM_NAME || "Hormones & Harmonie";
    const date = new Date(`${a.available_date}T12:00:00Z`).toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Brussels" });
    const details = [
      ["Référence", a.appointment_number], ["Client", `${a.first_name} ${a.last_name}`],
      ["E-mail", a.email], ["Téléphone", a.phone || "Non renseigné"],
      ["Consultation", a.service_name], ["Description", a.description || a.short_description || "—"], ["Type de consultation", typeLabels[a.meeting_type] || a.meeting_type],
      ["Date", date], ["Horaire (heure de Bruxelles)", `${a.start_time.slice(0, 5)} – ${a.end_time.slice(0, 5)}`],
      ["Durée prévue", `${a.duration_minutes} minutes`],
      ["Montant", (a.amount_cents / 100).toLocaleString("fr-BE", { style: "currency", currency: "EUR" })],
      ["Paiement", a.payment_status === "free" ? "Consultation gratuite" : "Payé"],
      ["Plateforme souhaitée", platformLabels[a.platform_preference]],
      ["Lien de réunion prévu", a.meeting_url || "Le lien ou les modalités vous seront communiqués par notre équipe."],
    ];
    const preference = a.platform_preference !== "default" ? "Votre préférence a été transmise à notre équipe. Le lien prévu reste valable tant qu’un nouveau lien ne vous a pas été communiqué." : "";
    const url = confirmationUrl(record.confirmation_token);
    const footer = [name, company?.email, company?.phone, company?.address, company?.enterprise_number].filter(Boolean).join(" · ");
    await mailer.sendMail({
      from: { name, address: from }, replyTo: company?.email || from, to: a.email,
      subject: `Confirmation de réservation — ${a.service_name} — ${name}`,
      text: `Merci, votre consultation est confirmée.\n${details.map(([label, value]) => `${label} : ${value}`).join("\n")}\n${preference}\nVoir ma réservation : ${url}\n${footer}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#40332e;padding:24px;background:#faf7f3"><h1>${escape(name)}</h1><h2>Merci, votre consultation est confirmée !</h2>${details.map(([label, value]) => `<p><strong>${escape(label)} :</strong> ${escape(value)}</p>`).join("")}${a.meeting_url ? `<p><a href="${escape(a.meeting_url)}">Accéder à la réunion</a></p>` : ""}<p>${escape(preference)}</p><p><a href="${escape(url)}" style="display:inline-block;padding:16px;background:#a97889;color:white;border-radius:8px">Voir ma réservation</a></p><hr><p>${escape(footer)}</p></div>`,
    });
    await query("UPDATE appointments SET confirmation_sent_at = NOW(), confirmation_send_started_at = NULL WHERE id = ?", [record.id]);
  } catch (error) {
    await query("UPDATE appointments SET confirmation_send_started_at = NULL WHERE id = ? AND confirmation_sent_at IS NULL", [record.id]);
    throw error;
  }
}
