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

const ALLOWED_PAGES = new Set(["shop", "home", "about", "faqs", "contact", "approach", "consultation", "events"]);

const allowedPages = ALLOWED_PAGES;

export const getActiveBannerByPageName = async (req, res) => {
  try {
    const pageName = String(req.params.page_name || "").trim();

    if (!allowedPages.has(pageName)) {
      return res.status(400).json({ error: "Invalid page_name" });
    }

    const rows = await query(
      `
      SELECT *
      FROM banners
      WHERE page_name = ? AND is_active = 1
      ORDER BY display_order ASC, created_at DESC
      LIMIT 1
      `,
      [pageName]
    );

    res.json({ banner: rows[0] || null });
  } catch (error) {
    console.error("Get active banner error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const getBanners = async (req, res) => {
  try {
    const { page_name, active } = req.query;

    let sql = `
      SELECT *
      FROM banners
      WHERE 1=1
    `;
    const params = [];

    if (page_name) {
      if (!ALLOWED_PAGES.has(String(page_name))) {
        return res.status(400).json({ error: "Invalid page_name" });
      }
      sql += " AND page_name = ?";
      params.push(page_name);
    }

    if (active !== undefined) {
      const isActive = toBoolTiny(active, 1);
      sql += " AND is_active = ?";
      params.push(isActive);
    }

    sql += " ORDER BY display_order ASC, created_at DESC";

    const banners = await query(sql, params);
    res.json({ banners });
  } catch (error) {
    console.error("Get banners error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getBannerById = async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await query("SELECT * FROM banners WHERE id = ? LIMIT 1", [id]);
    if (!rows[0]) return res.status(404).json({ error: "Banner not found" });

    res.json({ banner: rows[0] });
  } catch (error) {
    console.error("Get banner by id error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createBanner = async (req, res) => {
  try {
    const {
      page_name,
      title = null,
      subtitle = null,
      button = null,
      link = null,
      background_img = null,
      is_active = 1,
      display_order = 0,
    } = req.body ?? {};

    if (!page_name) return res.status(400).json({ error: "page_name is required" });
    if (!ALLOWED_PAGES.has(String(page_name))) {
      return res.status(400).json({ error: "Invalid page_name" });
    }

    const idRows = await query("SELECT UUID() AS id");
    const id = idRows[0].id;

    await query(
      `
      INSERT INTO banners
        (id, page_name, title, subtitle, button, link, background_img, is_active, display_order)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        page_name,
        // The title is optional in the form, but NOT NULL in the SQL schema.
        title ?? "",
        subtitle,
        button,
        link,
        background_img,
        toBoolTiny(is_active, 1),
        toInt(display_order, 0),
      ]
    );

    const [banner] = await query("SELECT * FROM banners WHERE id = ?", [id]);
    res.status(201).json({ banner });
  } catch (error) {
    console.error("Create banner error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query("SELECT * FROM banners WHERE id = ? LIMIT 1", [id]);
    if (!existing[0]) return res.status(404).json({ error: "Banner not found" });

    const {
      page_name,
      title,
      subtitle,
      button,
      link,
      background_img,
      is_active,
      display_order,
    } = req.body ?? {};

    const patch = [];
    const params = [];

    if (page_name !== undefined) {
      if (!page_name) return res.status(400).json({ error: "page_name cannot be empty" });
      if (!ALLOWED_PAGES.has(String(page_name))) {
        return res.status(400).json({ error: "Invalid page_name" });
      }
      patch.push("page_name = ?");
      params.push(page_name);
    }

    if (title !== undefined) {
      patch.push("title = ?");
      params.push(title ?? "");
    }

    if (subtitle !== undefined) {
      patch.push("subtitle = ?");
      params.push(subtitle);
    }

    if (button !== undefined) {
      patch.push("button = ?");
      params.push(button);
    }

    if (link !== undefined) {
      patch.push("link = ?");
      params.push(link);
    }

    if (background_img !== undefined) {
      patch.push("background_img = ?");
      params.push(background_img);
    }

    if (is_active !== undefined) {
      patch.push("is_active = ?");
      params.push(toBoolTiny(is_active, 1));
    }

    if (display_order !== undefined) {
      patch.push("display_order = ?");
      params.push(toInt(display_order, 0));
    }

    if (patch.length) {
      await query(`UPDATE banners SET ${patch.join(", ")} WHERE id = ?`, [...params, id]);
    }

    const [banner] = await query("SELECT * FROM banners WHERE id = ?", [id]);
    res.json({ banner });
  } catch (error) {
    console.error("Update banner error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await query("SELECT id FROM banners WHERE id = ? LIMIT 1", [id]);
    if (!rows[0]) return res.status(404).json({ error: "Banner not found" });

    await query("DELETE FROM banners WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete banner error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
