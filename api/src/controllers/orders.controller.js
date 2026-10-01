import { sendApiError } from "../utils/apiError.js";
// api/src/controllers/orders.controller.js
import { createCheckout, getOrderForUser } from "../services/orders.service.js";

export async function checkout(req, res) {
  try {
    const userId = 0; // guest
    const { cart_items, coupon_code, shipping, ambassador_code } = req.body || {};

    const data = await createCheckout({
      userId,
      cart_items,
      coupon_code,
      ambassador_code,
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