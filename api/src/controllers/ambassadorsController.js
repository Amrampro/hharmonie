// api/src/controllers/ambassadorsController.js
import crypto from "node:crypto";
import { query } from "../config/database.js";

function normalizeIban(v) {
  const s = String(v || "").trim();
  return s ? s.replace(/\s+/g, "").toUpperCase() : null;
}

function makeCode(prefix = "AMB") {
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 chars
  return `${prefix}-${rand}`; // AMB-4F9A2C
}

export const getMeAmbassador = async (req, res) => {
  try {
    const userId = req.user.id;

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

    return res.json({ ambassador: rows?.[0] ?? null });
  } catch (error) {
    console.error("getMeAmbassador error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const createMeAmbassador = async (req, res) => {
  try {
    const userId = req.user.id;
    const { iban, bank_account_name } = req.body || {};

    const existing = await query(
      "SELECT id FROM ambassadors WHERE user_id = ? LIMIT 1",
      [userId],
    );
    if (existing.length) {
      return res.status(400).json({ error: "Ambassador profile already exists" });
    }

    // récup infos user (optionnel pour améliorer code)
    const users = await query(
      "SELECT first_name, last_name FROM users WHERE id = ? LIMIT 1",
      [userId],
    );
    const u = users?.[0] || {};
    const prefix =
      `${u.first_name || ""}${u.last_name || ""}`
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10) || "AMB";

    // code unique (petit retry)
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
  } catch (error) {
    console.error("createMeAmbassador error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateMeAmbassadorBank = async (req, res) => {
  try {
    const userId = req.user.id;
    const { iban, bank_account_name } = req.body || {};

    if (iban === undefined && bank_account_name === undefined) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const ambRows = await query(
      "SELECT id FROM ambassadors WHERE user_id = ? LIMIT 1",
      [userId],
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
      values,
    );

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

    return res.json({ message: "Ambassador updated", ambassador: rows?.[0] ?? null });
  } catch (error) {
    console.error("updateMeAmbassadorBank error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};