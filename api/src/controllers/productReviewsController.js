import { sendApiError } from "../utils/apiError.js";
// api/src/controllers/productReviewsController.js
import { query } from "../config/database.js";

const toInt = (v, def = 0) => {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
};

function isEmail(s) {
  const v = String(s ?? "").trim();
  return /^\S+@\S+\.\S+$/.test(v);
}

async function productExists(productId) {
  const rows = await query("SELECT id FROM products WHERE id = ? LIMIT 1", [productId]);
  return Boolean(rows[0]);
}

export const listProductReviews = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const limit = Math.min(toInt(req.query.limit, 50), 200);
    const offset = Math.max(toInt(req.query.offset, 0), 0);

    if (!(await productExists(productId))) {
      return res.status(404).json({ error: "Product not found" });
    }

    const reviews = await query(
      `
      SELECT *
      FROM product_reviews
      WHERE product_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
      `,
      [productId, limit, offset]
    );

    res.json({ reviews });
  } catch (error) {
    console.error("List product reviews error:", error);
    sendApiError(res, error);
  }
};

export const createProductReview = async (req, res) => {
  try {
    const { id: productId } = req.params;

    if (!(await productExists(productId))) {
      return res.status(404).json({ error: "Product not found" });
    }

    const {
      customer_name,
      customer_email,
      rating,
      title = null,
      comment = null,
      // is_verified_purchase is not user-controlled (security)
    } = req.body ?? {};

    if (!String(customer_name ?? "").trim()) {
      return res.status(400).json({ error: "customer_name is required" });
    }
    if (!String(customer_email ?? "").trim() || !isEmail(customer_email)) {
      return res.status(400).json({ error: "customer_email is invalid" });
    }

    const r = toInt(rating, 0);
    if (r < 1 || r > 5) {
      return res.status(400).json({ error: "rating must be between 1 and 5" });
    }

    const idRows = await query("SELECT UUID() AS id");
    const reviewId = idRows[0].id;

    await query(
      `
      INSERT INTO product_reviews
        (id, product_id, customer_name, customer_email, rating, title, comment, is_verified_purchase, helpful_count)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, FALSE, 0)
      `,
      [
        reviewId,
        productId,
        String(customer_name).trim(),
        String(customer_email).trim(),
        r,
        title ? String(title).trim() : null,
        comment ? String(comment).trim() : null,
      ]
    );

    const [review] = await query("SELECT * FROM product_reviews WHERE id = ? LIMIT 1", [
      reviewId,
    ]);

    res.status(201).json({ review });
  } catch (error) {
    console.error("Create product review error:", error);
    sendApiError(res, error);
  }
};

// --------- Admin ---------

export const adminListReviews = async (req, res) => {
  try {
    const { product_id, email, rating, limit = 100, offset = 0 } = req.query;

    const lim = Math.min(toInt(limit, 100), 500);
    const off = Math.max(toInt(offset, 0), 0);

    let sql = `
      SELECT pr.*, p.name AS product_name, p.slug AS product_slug
      FROM product_reviews pr
      LEFT JOIN products p ON p.id = pr.product_id
      WHERE 1=1
    `;
    const params = [];

    if (product_id) {
      sql += " AND pr.product_id = ?";
      params.push(String(product_id));
    }
    if (email) {
      sql += " AND pr.customer_email LIKE ?";
      params.push(`%${String(email)}%`);
    }
    if (rating) {
      const r = toInt(rating, 0);
      if (r >= 1 && r <= 5) {
        sql += " AND pr.rating = ?";
        params.push(r);
      }
    }

    sql += " ORDER BY pr.created_at DESC LIMIT ? OFFSET ?";
    params.push(lim, off);

    const reviews = await query(sql, params);
    res.json({ reviews });
  } catch (error) {
    console.error("Admin list reviews error:", error);
    sendApiError(res, error);
  }
};

export const adminDeleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await query("SELECT id FROM product_reviews WHERE id = ? LIMIT 1", [id]);
    if (!rows[0]) return res.status(404).json({ error: "Review not found" });

    await query("DELETE FROM product_reviews WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Admin delete review error:", error);
    sendApiError(res, error);
  }
};
