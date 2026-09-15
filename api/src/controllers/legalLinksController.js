// api/src/controllers/bannersController.js
import { query } from "../config/database.js";

const toInt = (v, def = 0) => {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
};

const toBoolTiny = (v, def = 1) => {
  if (v === true || v === 1 || v === "1") return 1;
  if (v === false || v === 0 || v === "0") return 0;
  return def;
};

export const getLegalLinks = async (req, res) => {
  try {
    const { active } = req.query;

    let sql = `
      SELECT *
      FROM legal_links
      WHERE 1=1
    `;
    const params = [];

    if (active !== undefined) {
      sql += " AND is_active = ?";
      params.push(toBoolTiny(active, 1));
    }

    sql += " ORDER BY display_order ASC, created_at DESC";

    const links = await query(sql, params);
    res.json({ links });
  } catch (error) {
    console.error("Get legal links error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLegalLinkById = async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await query("SELECT * FROM legal_links WHERE id = ? LIMIT 1", [id]);
    if (!rows[0]) return res.status(404).json({ error: "Legal link not found" });

    res.json({ link: rows[0] });
  } catch (error) {
    console.error("Get legal link by id error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createLegalLink = async (req, res) => {
  try {
    const { name, file, display_order = 0, is_active = 1 } = req.body ?? {};

    if (!name) return res.status(400).json({ error: "name is required" });
    if (!file) return res.status(400).json({ error: "file is required" });

    const idRows = await query("SELECT UUID() AS id");
    const id = idRows[0].id;

    await query(
      `
      INSERT INTO legal_links (id, name, file, display_order, is_active)
      VALUES (?, ?, ?, ?, ?)
      `,
      [id, name, file, toInt(display_order, 0), toBoolTiny(is_active, 1)]
    );

    const [linkRow] = await query("SELECT * FROM legal_links WHERE id = ?", [id]);
    res.status(201).json({ link: linkRow });
  } catch (error) {
    console.error("Create legal link error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateLegalLink = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query("SELECT * FROM legal_links WHERE id = ? LIMIT 1", [id]);
    if (!existing[0]) return res.status(404).json({ error: "Legal link not found" });

    const { name, file, display_order, is_active } = req.body ?? {};

    const patch = [];
    const params = [];

    if (name !== undefined) {
      if (!name) return res.status(400).json({ error: "name cannot be empty" });
      patch.push("name = ?");
      params.push(name);
    }

    if (file !== undefined) {
      if (!file) return res.status(400).json({ error: "file cannot be empty" });
      patch.push("file = ?");
      params.push(file);
    }

    if (display_order !== undefined) {
      patch.push("display_order = ?");
      params.push(toInt(display_order, 0));
    }

    if (is_active !== undefined) {
      patch.push("is_active = ?");
      params.push(toBoolTiny(is_active, 1));
    }

    if (patch.length) {
      await query(`UPDATE legal_links SET ${patch.join(", ")} WHERE id = ?`, [
        ...params,
        id,
      ]);
    }

    const [linkRow] = await query("SELECT * FROM legal_links WHERE id = ?", [id]);
    res.json({ link: linkRow });
  } catch (error) {
    console.error("Update legal link error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteLegalLink = async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await query("SELECT id FROM legal_links WHERE id = ? LIMIT 1", [id]);
    if (!rows[0]) return res.status(404).json({ error: "Legal link not found" });

    await query("DELETE FROM legal_links WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete legal link error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
