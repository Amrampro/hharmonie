// api/src/controllers/auth/profile.controller.js
import { query } from "../../config/database.js";

export async function getProfile(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const rows = await query(
      `SELECT id, email, first_name, last_name, phone, is_admin, created_at
       FROM users WHERE id = ? LIMIT 1`,
      [userId],
    );

    const user = rows?.[0];
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({ user });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Internal server error" });
  }
}

export async function updateProfile(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { firstName, lastName, phone } = req.body || {};

    const updates = [];
    const params = [];

    if (firstName !== undefined) {
      updates.push("first_name = ?");
      params.push(String(firstName));
    }
    if (lastName !== undefined) {
      updates.push("last_name = ?");
      params.push(String(lastName));
    }
    if (phone !== undefined) {
      updates.push("phone = ?");
      params.push(String(phone));
    }

    if (!updates.length) {
      return res.status(400).json({ error: "No fields to update" });
    }

    params.push(userId);

    await query(`UPDATE users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`, params);

    const rows = await query(
      `SELECT id, email, first_name, last_name, phone, is_admin, created_at
       FROM users WHERE id = ? LIMIT 1`,
      [userId],
    );

    return res.json({ message: "Profile updated", user: rows?.[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Internal server error" });
  }
}