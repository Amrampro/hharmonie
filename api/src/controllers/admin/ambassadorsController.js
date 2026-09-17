import { sendApiError } from "../../utils/apiError.js";
// api/src/controllers/admin/ambassadorsController.js
import {
  listAmbassadorsAdmin,
  createPayoutAdmin,
  computeAmbassadorDueCents,
} from "../../services/ambassadors/ambassadors.service.js";
import { query } from "../../config/database.js";
import { sendAmbassadorPayoutEmail } from "../../services/email/ambassadorPayout.service.js";

function sendError(res, error) {
  console.error("Admin request error:", error);
  return sendApiError(res, error);
}

export const getAmbassadors = async (req, res) => {
  try {
    const data = await listAmbassadorsAdmin(req.query || {});
    return res.json(data);
  } catch (e) {
    return sendError(res, e);
  }
};

export const getAmbassadorById = async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await query(
      `
      SELECT
        a.*, u.email, u.first_name, u.last_name, u.phone
      FROM ambassadors a
      JOIN users u ON u.id = a.user_id
      WHERE a.id = ?
      LIMIT 1
      `,
      [id],
    );

    const ambassador = rows?.[0];
    if (!ambassador) return res.status(404).json({ error: "Not found" });

    const due_amount = await computeAmbassadorDueCents(id);

    return res.json({ ambassador: { ...ambassador, due_amount, currency: "EUR" } });
  } catch (e) {
    return sendError(res, e);
  }
};

export const getAmbassadorOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const orders = await query(
      `
      SELECT id, status, total_amount, currency, created_at,
             ambassador_commission_amount
      FROM orders
      WHERE ambassador_id = ?
      ORDER BY created_at DESC
      LIMIT 200
      `,
      [id],
    );
    return res.json({ orders });
  } catch (e) {
    return sendError(res, e);
  }
};

export const getAmbassadorPayouts = async (req, res) => {
  try {
    const { id } = req.params;
    const payouts = await query(
      `
      SELECT id, amount, currency, paid_at, note, created_at
      FROM ambassador_payouts
      WHERE ambassador_id = ?
      ORDER BY paid_at DESC
      LIMIT 200
      `,
      [id],
    );
    return res.json({ payouts });
  } catch (e) {
    return sendError(res, e);
  }
};

export const payAmbassador = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, note } = req.body || {};

    // si tu as req.user (admin), mets-le ici
    const adminUserId = req.user?.id ?? null;

    const payout = await createPayoutAdmin({
      ambassadorId: id,
      amount,
      adminUserId,
      note: note ?? null,
    });

    // The payout is already saved. An SMTP failure must not report a failed
    // payment and encourage the administrator to submit it a second time.
    try {
      await sendAmbassadorPayoutEmail({ ambassadorId: id, payout });
    } catch (emailError) {
      console.error("Payout saved, notification email failed:", emailError);
      return res.json({ message: "Payout created", payout, warning: "Paiement enregistré, mais l’e-mail de confirmation n’a pas pu être envoyé." });
    }

    return res.json({ message: "Payout created", payout });
  } catch (e) {
    return sendError(res, e);
  }
};
