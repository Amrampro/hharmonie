import { sendApiError } from "../utils/apiError.js";
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
    .slice(0, 120);

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
    sendApiError(res, error);
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
    sendApiError(res, error);
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

    const categoryName = await validCategory(category);

    // Historical installations use UUIDs; schema.sql uses an AUTO_INCREMENT id.
    const [idColumn] = await query("SHOW COLUMNS FROM faqs LIKE 'id'");
    const autoId = String(idColumn?.Extra).includes("auto_increment");
    const id = autoId ? null : (await query("SELECT UUID() AS id"))[0].id;

    const result = await query(
      `
      INSERT INTO faqs (id, question, answer, category, display_order)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        id,
        String(question).trim().slice(0, 500),
        String(answer).trim(),
        categoryName,
        toInt(display_order, 0),
      ]
    );

    const [faq] = await query("SELECT * FROM faqs WHERE id = ?", [autoId ? result.insertId : id]);
    res.status(201).json({ faq });
  } catch (error) {
    console.error("Create faq error:", error);
    sendApiError(res, error);
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
      params.push(await validCategory(category));
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
    sendApiError(res, error);
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
    sendApiError(res, error);
  }
};

export const getCategories = async (_req, res) => {
  try { res.json({ categories: await query("SELECT name FROM faq_categories ORDER BY name ASC") }); }
  catch (error) { sendApiError(res, error); }
};
export const createCategory = async (req, res) => {
  try {
    const name = req.body?.name;
    if (typeof name !== "string" || !name.trim() || name.trim().length > 120) return res.status(400).json({ error: "Indiquez un nom de catégorie (120 caractères maximum)." });
    const category = normalizeCategory(name);
    await query("INSERT INTO faq_categories (name) VALUES (?)", [category]);
    res.status(201).json({ category: { name: category } });
  } catch (error) { sendApiError(res, error); }
};
async function validCategory(value) {
  const name = normalizeCategory(value || "Général");
  const [found] = await query("SELECT name FROM faq_categories WHERE name = ?", [name]);
  if (!found) throw Object.assign(new Error("Sélectionnez une catégorie existante ou créez-la d’abord."), { statusCode: 400 });
  return found.name;
}
