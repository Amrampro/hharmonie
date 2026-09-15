// api/src/controllers/ambassadors/me.controller.js
import crypto from "node:crypto";
import { query } from "../../config/database.js";
import { generateAmbassadorCode } from "../../utils/ambassadors/generateCode.js";
import { computeAmbassadorDueCents } from "../../services/ambassadors/ambassadors.service.js";

export async function getMeAmbassador(req, res) {
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
      [userId],
    );

    const ambassador = rows?.[0] ?? null;
    if (!ambassador) return res.json({ ambassador: null });

    const due_amount = await computeAmbassadorDueCents(ambassador.id);

    return res.json({ ambassador: { ...ambassador, due_amount, currency: "EUR" } });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Internal server error" });
  }
}

export async function createMeAmbassador(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const existing = await query(`SELECT id FROM ambassadors WHERE user_id = ? LIMIT 1`, [userId]);
    if (existing?.length) {
      return res.status(400).json({ error: "Ambassador profile already exists" });
    }

    const urows = await query(
      `SELECT first_name, last_name FROM users WHERE id = ? LIMIT 1`,
      [userId],
    );
    const u = urows?.[0] || {};

    const { iban, bank_account_name } = req.body || {};

    // generate unique code (retry small)
    let code = generateAmbassadorCode({ firstName: u.first_name, lastName: u.last_name });
    for (let i = 0; i < 5; i++) {
      const check = await query(`SELECT id FROM ambassadors WHERE code = ? LIMIT 1`, [code]);
      if (!check?.length) break;
      code = generateAmbassadorCode({ firstName: u.first_name, lastName: u.last_name });
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
        iban ? String(iban).trim() : null,
        bank_account_name ? String(bank_account_name).trim() : null,
      ],
    );

    const rows = await query(
      `
      SELECT a.*, u.email, u.first_name, u.last_name, u.phone
      FROM ambassadors a
      JOIN users u ON u.id = a.user_id
      WHERE a.id = ?
      LIMIT 1
      `,
      [id],
    );

    return res.json({ message: "Ambassador created", ambassador: rows?.[0] ?? null });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Internal server error" });
  }
}

export async function updateMeAmbassadorBank(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { iban, bank_account_name } = req.body || {};
    if (iban === undefined && bank_account_name === undefined) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const rows = await query(`SELECT id FROM ambassadors WHERE user_id = ? LIMIT 1`, [userId]);
    const amb = rows?.[0];
    if (!amb) return res.status(404).json({ error: "Ambassador profile not found" });

    const updates = [];
    const params = [];

    if (iban !== undefined) {
      updates.push("iban = ?");
      params.push(String(iban).trim() || null);
    }
    if (bank_account_name !== undefined) {
      updates.push("bank_account_name = ?");
      params.push(String(bank_account_name).trim() || null);
    }

    params.push(amb.id);

    await query(`UPDATE ambassadors SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`, params);

    const fresh = await query(
      `
      SELECT a.*, u.email, u.first_name, u.last_name, u.phone
      FROM ambassadors a
      JOIN users u ON u.id = a.user_id
      WHERE a.id = ?
      LIMIT 1
      `,
      [amb.id],
    );

    return res.json({ message: "Ambassador updated", ambassador: fresh?.[0] ?? null });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Internal server error" });
  }
}