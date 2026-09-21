import { randomUUID } from "node:crypto";
import { query } from "../config/database.js";
import { sendApiError } from "../utils/apiError.js";

export async function sendContactMessage(req, res) {
  try {
    const values = ["name", "email", "subject", "message"].map(key => typeof req.body?.[key] === "string" ? req.body[key].trim() : "");
    if (values.some((value, i) => !value || value.length > [190, 254, 255, 10000][i])) return res.status(400).json({ error: "Veuillez compléter les champs et respecter leur longueur maximale." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[1])) return res.status(400).json({ error: "Email invalide." });
    await query("INSERT INTO contact_messages (id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)", [randomUUID(), ...values]);
    return res.status(201).json({ success: true, message: "Votre message a bien été transmis. Merci !" });
  } catch (error) { return sendApiError(res, error); }
}
