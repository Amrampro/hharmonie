// api/src/controllers/newsletterController.js
import { query } from "../config/database.js";

const toInt = (v, def = 0) => {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
};

const normalizeEmail = (email) =>
  String(email ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 191);

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// POST /api/v1/newsletter/subscribe
export const subscribeNewsletter = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!email) return res.status(400).json({ error: "email is required" });
    if (!isValidEmail(email))
      return res.status(400).json({ error: "invalid email format" });

    // if already exists -> 200 with status
    const exists = await query(
      "SELECT id FROM newsletter_subscribers WHERE email = ? LIMIT 1",
      [email]
    );

    if (exists[0]) {
      return res.json({
        status: "already_subscribed",
        subscriber: { id: exists[0].id, email },
      });
    }

    const [idRow] = await query("SELECT UUID() AS id");
    const id = idRow.id;

    await query(
      `INSERT INTO newsletter_subscribers (id, email) VALUES (?, ?)`,
      [id, email]
    );

    const [subscriber] = await query(
      "SELECT id, email, created_at FROM newsletter_subscribers WHERE id = ? LIMIT 1",
      [id]
    );

    return res.status(201).json({ status: "subscribed", subscriber });
  } catch (error) {
    console.error("Subscribe newsletter error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/v1/admin/newsletter-subscribers?search=...&limit=...&offset=...
export const adminListNewsletterSubscribers = async (req, res) => {
  try {
    const { search, limit = 200, offset = 0 } = req.query;

    let sql = `
      SELECT id, email, created_at
      FROM newsletter_subscribers
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += " AND email LIKE ?";
      params.push(`%${String(search).trim()}%`);
    }

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(toInt(limit, 200), toInt(offset, 0));

    const items = await query(sql, params);

    // total (with same filter)
    let countSql = `
      SELECT COUNT(*) AS total
      FROM newsletter_subscribers
      WHERE 1=1
    `;
    const countParams = [];

    if (search) {
      countSql += " AND email LIKE ?";
      countParams.push(`%${String(search).trim()}%`);
    }

    const [countRow] = await query(countSql, countParams);

    return res.json({ items, total: Number(countRow?.total ?? 0) });
  } catch (error) {
    console.error("List newsletter subscribers error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE /api/v1/admin/newsletter-subscribers/:id
export const adminDeleteNewsletterSubscriber = async (req, res) => {
  try {
    const { id } = req.params;

    const exists = await query(
      "SELECT id FROM newsletter_subscribers WHERE id = ? LIMIT 1",
      [id]
    );
    if (!exists[0])
      return res.status(404).json({ error: "Subscriber not found" });

    await query("DELETE FROM newsletter_subscribers WHERE id = ?", [id]);
    return res.json({ success: true });
  } catch (error) {
    console.error("Delete newsletter subscriber error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
