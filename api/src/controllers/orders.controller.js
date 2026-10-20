import { sendApiError } from "../utils/apiError.js";
// api/src/controllers/orders.controller.js
import { createCheckout, getOrderForUser, lookupOrder } from "../services/orders.service.js";
import { query } from "../config/database.js";
import { renderInvoicePdf } from "../services/invoicePdf.service.js";

export async function lookup(req, res) {
  try {
    const data = await lookupOrder(req.body?.reference, req.body?.email);
    res.setHeader("Cache-Control", "no-store");
    res.json(data);
  } catch { res.status(404).json({ error: "Commande introuvable. Vérifiez le numéro de commande et l’e-mail utilisé à l’achat." }); }
}
export async function invoice(req, res) {
  try {
    const data = await getOrderForUser({ orderId: req.params.id, token: req.query.token });
    if (!["paid", "processing", "shipped", "delivered", "completed", "refunded"].includes(data.order.status)) return res.status(409).json({ error: "La facture sera disponible après confirmation du paiement." });
    const [company] = await query("SELECT * FROM parameters ORDER BY created_at ASC LIMIT 1");
    const pdf = await renderInvoicePdf(data, company);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="facture-${data.order.id.replace(/[^a-zA-Z0-9-]/g, "")}.pdf"`);
    res.send(pdf);
  } catch { res.status(404).json({ error: "Facture indisponible. Utilisez votre lien privé de suivi." }); }
}

export async function checkout(req, res) {
  try {
    const userId = 0; // guest
    const { cart_items, coupon_code, shipping } = req.body || {};

    const data = await createCheckout({
      userId,
      cart_items,
      coupon_code,
      shipping,
    });

    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message || "Checkout failed" });
  }
}

export async function getMyOrder(req, res) {
  try {
    const orderId = req.params.id;
    const data = await getOrderForUser({ orderId, token: req.query.token, sessionId: req.params.sessionId });
    res.setHeader("Cache-Control", "no-store");
    res.json(data);
  } catch (e) {
    if (e.code) return sendApiError(res, e);
    res.status(404).json({ error: e.message || "Commande introuvable." });
  }
}

// get single order for user (for order success page)
export async function getOrder(req, res) {
  try {
    const orderId = req.params.id;
    const data = await getOrderForUser({ orderId, token: req.query.token, sessionId: req.params.sessionId });
    res.setHeader("Cache-Control", "no-store");
    res.json(data);
  } catch (e) {
    if (e.code) return sendApiError(res, e);
    res.status(404).json({ error: e.message || "Commande introuvable." });
  }
}
