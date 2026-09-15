// api/src/controllers/faqsController.js
import { query } from "../config/database.js";

const toInt = (v, def = 0) => {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
};

const normalizeCategory = (s) =>
  String(s ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 100);

// GET /api/v1/faqs?category=...&search=...&limit=...&offset=...
export const getFaqs = async (req, res) => {
  try {
    const { category, search, limit = 200, offset = 0 } = req.query;

    let sql = `
      SELECT *
      FROM faqs
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      sql += " AND category = ?";
      params.push(normalizeCategory(category));
    }

    if (search) {
      sql += " AND (question LIKE ? OR answer LIKE ? OR category LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    sql += " ORDER BY display_order ASC, created_at DESC LIMIT ? OFFSET ?";
    params.push(toInt(limit, 200), toInt(offset, 0));

    const faqs = await query(sql, params);
    res.json({ faqs });
  } catch (error) {
    console.error("Get faqs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/v1/faqs/:id
export const getFaqById = async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await query("SELECT * FROM faqs WHERE id = ? LIMIT 1", [id]);
    if (!rows[0]) return res.status(404).json({ error: "FAQ not found" });

    res.json({ faq: rows[0] });
  } catch (error) {
    console.error("Get faq error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/v1/admin/faqs
export const createFaq = async (req, res) => {
  try {
    const {
      question,
      answer,
      category = null,
      display_order = 0,
    } = req.body ?? {};

    if (!question?.trim()) return res.status(400).json({ error: "question is required" });
    if (!answer?.trim()) return res.status(400).json({ error: "answer is required" });

    const idRows = await query("SELECT UUID() AS id");
    const id = idRows[0].id;

    await query(
      `
      INSERT INTO faqs (id, question, answer, category, display_order)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        id,
        String(question).trim().slice(0, 500),
        String(answer).trim(),
        category ? normalizeCategory(category) : null,
        toInt(display_order, 0),
      ]
    );

    const [faq] = await query("SELECT * FROM faqs WHERE id = ?", [id]);
    res.status(201).json({ faq });
  } catch (error) {
    console.error("Create faq error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PUT /api/v1/admin/faqs/:id
export const updateFaq = async (req, res) => {
  try {
    const { id } = req.params;

    const exists = await query("SELECT id FROM faqs WHERE id = ? LIMIT 1", [id]);
    if (!exists[0]) return res.status(404).json({ error: "FAQ not found" });

    const { question, answer, category, display_order } = req.body ?? {};

    const patch = [];
    const params = [];

    if (question !== undefined) {
      if (!String(question).trim()) return res.status(400).json({ error: "question cannot be empty" });
      patch.push("question = ?");
      params.push(String(question).trim().slice(0, 500));
    }

    if (answer !== undefined) {
      if (!String(answer).trim()) return res.status(400).json({ error: "answer cannot be empty" });
      patch.push("answer = ?");
      params.push(String(answer).trim());
    }

    if (category !== undefined) {
      patch.push("category = ?");
      params.push(category ? normalizeCategory(category) : null);
    }

    if (display_order !== undefined) {
      patch.push("display_order = ?");
      params.push(toInt(display_order, 0));
    }

    if (patch.length) {
      await query(`UPDATE faqs SET ${patch.join(", ")} WHERE id = ?`, [...params, id]);
    }

    const [faq] = await query("SELECT * FROM faqs WHERE id = ?", [id]);
    res.json({ faq });
  } catch (error) {
    console.error("Update faq error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE /api/v1/admin/faqs/:id
export const deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;

    const exists = await query("SELECT id FROM faqs WHERE id = ? LIMIT 1", [id]);
    if (!exists[0]) return res.status(404).json({ error: "FAQ not found" });

    await query("DELETE FROM faqs WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete faq error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
