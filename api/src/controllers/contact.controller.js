// api/src/controllers/contact.controller.js
import { mailer } from "../config/mailer.js";

const ADMIN_EMAIL = "noveden.beauty7@gmail.com";

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
}

function clean(v) {
  return String(v ?? "").trim();
}

export async function sendContactMessage(req, res) {
  try {
    const name = clean(req.body?.name);
    const email = clean(req.body?.email);
    const subject = clean(req.body?.subject);
    const message = clean(req.body?.message);

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "Tous les champs sont requis." });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ error: "Email invalide." });
    }

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;">
        <h2>Nouveau message depuis le formulaire de contact</h2>
        <p><b>Nom:</b> ${escapeHtml(name)}</p>
        <p><b>Email:</b> ${escapeHtml(email)}</p>
        <p><b>Sujet:</b> ${escapeHtml(subject)}</p>
        <hr />
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
      </div>
    `;

    await mailer.sendMail({
      from: process.env.MAIL_FROM || "no-reply@example.com",
      to: ADMIN_EMAIL,
      replyTo: email, // ✅ répondre directement au client
      subject: `[Contact] ${subject}`,
      html,
    });

    return res.json({ success: true, message: "Message envoyé avec succès." });
  } catch (e) {
    console.error("sendContactMessage error:", e);
    return res.status(500).json({ error: "Erreur lors de l'envoi du message." });
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
