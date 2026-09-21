import { Router } from "express";
import { randomUUID } from "node:crypto";
import { query } from "../config/database.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { sendApiError } from "../utils/apiError.js";
const router = Router();
const wrap = fn => async (req, res) => { try { await fn(req, res); } catch (error) { sendApiError(res, error); } };
const selectTestimonials = `SELECT t.*, p.name AS product_name, p.slug AS product_slug, p.image_url AS product_image, p.price AS product_price FROM testimonials t JOIN products p ON p.id = t.product_id`;
router.get("/testimonials", wrap(async (req, res) => res.json({ items: await query(`${selectTestimonials} WHERE t.is_active = 1 ORDER BY t.display_order, t.created_at DESC`) })));
router.get("/collaborators", wrap(async (req, res) => res.json({ items: await query("SELECT * FROM collaborators WHERE is_active = 1 ORDER BY display_order, company_name") })));
router.use("/admin", authenticateToken, requireAdmin, (req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
router.get("/admin/products", wrap(async (req, res) => res.json({ products: await query("SELECT id, name FROM products ORDER BY name") })));
for (const table of ["testimonials", "collaborators"]) {
  router.get(`/admin/${table}`, wrap(async (req, res) => res.json({ items: await query(table === "testimonials" ? `${selectTestimonials} ORDER BY t.display_order, t.created_at DESC` : "SELECT * FROM collaborators ORDER BY display_order, company_name") })));
  const save = wrap(async (req, res) => {
    const fields = table === "testimonials" ? { author_name: 190, photo_url: 1000, testimony: 10000, product_id: 36 } : { company_name: 190, person_name: 190, address: 500, phone: 50, country: 100 };
    const required = table === "testimonials" ? Object.keys(fields) : ["company_name"];
    const data = {};
    for (const [key, max] of Object.entries(fields)) {
      const value = typeof req.body?.[key] === "string" ? req.body[key].trim() : "";
      if ((required.includes(key) && !value) || value.length > max) return res.status(400).json({ error: `Champ invalide : ${key}` });
      data[key] = value || null;
    }
    if (table === "testimonials" && !/^(https?:\/\/|\/uploads\/)/i.test(data.photo_url)) return res.status(400).json({ error: "Photo invalide." });
    data.is_active = req.body?.is_active === true || req.body?.is_active === 1 ? 1 : 0;
    data.display_order = Number(req.body?.display_order ?? 0);
    if (!Number.isInteger(data.display_order) || data.display_order < 0 || data.display_order > 1000000) return res.status(400).json({ error: "Ordre invalide." });
    if (req.params.id) {
      const existing = await query(`SELECT id FROM ${table} WHERE id = ?`, [req.params.id]);
      if (!existing.length) return res.status(404).json({ error: "Élément introuvable." });
      await query(`UPDATE ${table} SET ${Object.keys(data).map(key => `${key} = ?`).join(", ")} WHERE id = ?`, [...Object.values(data), req.params.id]);
    } else {
      await query(`INSERT INTO ${table} (id, ${Object.keys(data).join(", ")}) VALUES (${Object.keys(data).map(() => "?").join(", ")}, ?)`, [randomUUID(), ...Object.values(data)]);
    }
    res.json({ success: true });
  });
  router.post(`/admin/${table}`, save);
  router.put(`/admin/${table}/:id`, save);
  router.delete(`/admin/${table}/:id`, wrap(async (req, res) => { await query(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]); res.json({ success: true }); }));
}
router.get("/admin/messages", wrap(async (req, res) => res.json({ items: await query("SELECT * FROM contact_messages ORDER BY created_at DESC") })));
router.put("/admin/messages/:id", wrap(async (req, res) => { await query("UPDATE contact_messages SET is_read = ? WHERE id = ?", [req.body?.is_read === true ? 1 : 0, req.params.id]); res.json({ success: true }); }));
export default router;
