// api/src/controllers/ambassadors/meAmbassadorController.js
import crypto from "node:crypto";
import { query } from "../../config/database.js";
import { computeAmbassadorDueCents } from "../../services/ambassadors/ambassadors.service.js";

function normalizeIban(v) {
  const s = String(v || "").trim();
  return s ? s.replace(/\s+/g, "").toUpperCase() : null;
}

function makeCode(prefix = "AMB") {
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${rand}`; // e.g AMB-4F9A2C
}

export const getMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const rows = await query(
      `
      SELECT a.*, u.email, u.first_name, u.last_name, u.phone
      FROM ambassadors a
      JOIN users u ON u.id = a.user_id
      WHERE a.user_id = ?
      LIMIT 1
      `,
      [userId]
    );

    const ambassador = rows?.[0] ?? null;

    // ✅ cas normal: pas encore ambassadeur
    if (!ambassador) return res.json({ ambassador: null });

    const due_amount = await computeAmbassadorDueCents(ambassador.id);
    return res.json({ ambassador: { ...ambassador, due_amount, currency: "EUR" } });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Internal server error" });
  }
};

// ✅ créer un compte ambassadeur
export const registerMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { iban, bank_account_name } = req.body || {};

    const existing = await query(
      "SELECT id FROM ambassadors WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (existing.length) {
      return res.status(400).json({ error: "Ambassador profile already exists" });
    }

    const prefix =
      `${req.user?.first_name || ""}${req.user?.last_name || ""}`
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10) || "AMB";

    let code = makeCode(prefix);
    for (let i = 0; i < 5; i++) {
      const check = await query("SELECT id FROM ambassadors WHERE code = ? LIMIT 1", [code]);
      if (!check.length) break;
      code = makeCode(prefix);
    }

    const id = crypto.randomUUID();

    await query(
      `
      INSERT INTO ambassadors
        (id, user_id, code, commission_type, commission_value, iban, bank_account_name, is_active, created_at, updated_at)
      VALUES
        (?, ?, ?, 'percentage', 10.00, ?, ?, 1, NOW(), NOW())
      `,
      [
        id,
        userId,
        code,
        normalizeIban(iban),
        bank_account_name ? String(bank_account_name).trim() : null,
      ]
    );

    const rows = await query(
      `
      SELECT a.*, u.email, u.first_name, u.last_name, u.phone
      FROM ambassadors a
      JOIN users u ON u.id = a.user_id
      WHERE a.id = ?
      LIMIT 1
      `,
      [id]
    );

    const ambassador = rows?.[0] ?? null;
    const due_amount = ambassador ? await computeAmbassadorDueCents(ambassador.id) : 0;

    return res.json({
      message: "Ambassador created",
      ambassador: ambassador ? { ...ambassador, due_amount, currency: "EUR" } : null,
    });
  } catch (error) {
    console.error("registerMe error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ update iban + nom banque
export const updateBank = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { iban, bank_account_name } = req.body || {};
    if (iban === undefined && bank_account_name === undefined) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const ambRows = await query(
      "SELECT id FROM ambassadors WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (!ambRows.length) {
      return res.status(404).json({ error: "Ambassador profile not found" });
    }

    const updates = [];
    const values = [];

    if (iban !== undefined) {
      updates.push("iban = ?");
      values.push(normalizeIban(iban));
    }
    if (bank_account_name !== undefined) {
      updates.push("bank_account_name = ?");
      values.push(String(bank_account_name || "").trim() || null);
    }

    values.push(ambRows[0].id);

    await query(
      `UPDATE ambassadors SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`,
      values
    );

    const rows = await query(
      `
      SELECT a.*, u.email, u.first_name, u.last_name, u.phone
      FROM ambassadors a
      JOIN users u ON u.id = a.user_id
      WHERE a.user_id = ?
      LIMIT 1
      `,
      [userId]
    );

    const ambassador = rows?.[0] ?? null;
    const due_amount = ambassador ? await computeAmbassadorDueCents(ambassador.id) : 0;

    return res.json({
      message: "Ambassador updated",
      ambassador: ambassador ? { ...ambassador, due_amount, currency: "EUR" } : null,
    });
  } catch (error) {
    console.error("updateBank error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const rows = await query("SELECT id FROM ambassadors WHERE user_id = ? LIMIT 1", [userId]);
    const amb = rows?.[0];
    if (!amb) return res.status(404).json({ error: "Ambassador profile not found" });

    const orders = await query(
      `
      SELECT id, status, total_amount, currency, created_at, ambassador_commission_amount
      FROM orders
      WHERE ambassador_id = ?
        AND status IN ('paid','processing','shipped','delivered','refunded','cancelled')
      ORDER BY created_at DESC
      LIMIT 200
      `,
      [amb.id]
    );

    return res.json({ orders });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Internal server error" });
  }
};

export const getMyPayouts = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const rows = await query("SELECT id FROM ambassadors WHERE user_id = ? LIMIT 1", [userId]);
    const amb = rows?.[0];
    if (!amb) return res.status(404).json({ error: "Ambassador profile not found" });

    const payouts = await query(
      `
      SELECT id, amount, currency, paid_at, note, created_at
      FROM ambassador_payouts
      WHERE ambassador_id = ?
      ORDER BY paid_at DESC
      LIMIT 200
      `,
      [amb.id]
    );

    return res.json({ payouts });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Internal server error" });
  }
};