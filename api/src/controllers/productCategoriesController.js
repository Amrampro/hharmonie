// api/src/controllers/productCategoriesController.js
import { query } from "../config/database.js";

const normalizeSlug = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function categoryExistsBySlug(slug, excludeId = null) {
  if (!excludeId) {
    const rows = await query(
      "SELECT id FROM product_categories WHERE slug = ? LIMIT 1",
      [slug]
    );
    return Boolean(rows[0]);
  }
  const rows = await query(
    "SELECT id FROM product_categories WHERE slug = ? AND id <> ? LIMIT 1",
    [slug, excludeId]
  );
  return Boolean(rows[0]);
}

export const getProductCategories = async (req, res) => {
  try {
    const categories = await query(
      "SELECT * FROM product_categories ORDER BY display_order, name"
    );
    res.json({ categories });
  } catch (error) {
    console.error("Get product categories error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createProductCategory = async (req, res) => {
  try {
    const {
      name,
      slug,
      description = null,
      image_url = null,
      display_order = 0,
      parent_id = null,
    } = req.body ?? {};

    if (!name) return res.status(400).json({ error: "name is required" });

    const finalSlug = normalizeSlug(slug || name);
    if (!finalSlug) return res.status(400).json({ error: "Invalid slug" });

    if (await categoryExistsBySlug(finalSlug)) {
      return res.status(409).json({ error: "Slug already exists" });
    }

    if (parent_id) {
      const parent = await query(
        "SELECT id FROM product_categories WHERE id = ? LIMIT 1",
        [parent_id]
      );
      if (!parent[0]) return res.status(400).json({ error: "Invalid parent_id" });
    }

    const idRows = await query("SELECT UUID() AS id");
    const id = idRows[0].id;

    await query(
      `
      INSERT INTO product_categories (id, parent_id, name, slug, description, image_url, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [id, parent_id, name, finalSlug, description, image_url, Number(display_order) || 0]
    );

    const [category] = await query(
      "SELECT * FROM product_categories WHERE id = ?",
      [id]
    );

    res.status(201).json({ category });
  } catch (error) {
    console.error("Create product category error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProductCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query(
      "SELECT * FROM product_categories WHERE id = ? LIMIT 1",
      [id]
    );
    if (!existing[0]) return res.status(404).json({ error: "Category not found" });

    const { name, slug, description, image_url, display_order, parent_id } =
      req.body ?? {};

    const patch = [];
    const params = [];

    if (name !== undefined) {
      if (!name) return res.status(400).json({ error: "name cannot be empty" });
      patch.push("name = ?");
      params.push(name);
    }

    if (slug !== undefined) {
      const finalSlug = normalizeSlug(slug || "");
      if (!finalSlug) return res.status(400).json({ error: "Invalid slug" });

      if (await categoryExistsBySlug(finalSlug, id)) {
        return res.status(409).json({ error: "Slug already exists" });
      }

      patch.push("slug = ?");
      params.push(finalSlug);
    }

    if (description !== undefined) {
      patch.push("description = ?");
      params.push(description);
    }

    if (image_url !== undefined) {
      patch.push("image_url = ?");
      params.push(image_url);
    }

    if (display_order !== undefined) {
      patch.push("display_order = ?");
      params.push(Number(display_order) || 0);
    }

    if (parent_id !== undefined) {
      if (parent_id === id) {
        return res.status(400).json({ error: "parent_id cannot be same as id" });
      }
      if (parent_id) {
        const parent = await query(
          "SELECT id FROM product_categories WHERE id = ? LIMIT 1",
          [parent_id]
        );
        if (!parent[0])
          return res.status(400).json({ error: "Invalid parent_id" });
      }
      patch.push("parent_id = ?");
      params.push(parent_id || null);
    }

    if (patch.length) {
      await query(`UPDATE product_categories SET ${patch.join(", ")} WHERE id = ?`, [
        ...params,
        id,
      ]);
    }

    const [category] = await query(
      "SELECT * FROM product_categories WHERE id = ?",
      [id]
    );

    res.json({ category });
  } catch (error) {
    console.error("Update product category error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteProductCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query(
      "SELECT id FROM product_categories WHERE id = ? LIMIT 1",
      [id]
    );
    if (!existing[0]) return res.status(404).json({ error: "Category not found" });

    const linked = await query(
      "SELECT 1 FROM product_category_pivot WHERE category_id = ? LIMIT 1",
      [id]
    );
    if (linked.length) {
      return res.status(409).json({
        error: "Category is used by products. Remove links before deleting.",
      });
    }

    await query("DELETE FROM product_categories WHERE id = ?", [id]);

    res.json({ success: true });
  } catch (error) {
    console.error("Delete product category error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
