// api/src/controllers/blogController.js
import { query } from "../config/database.js";

const toInt = (v, def = 0) => {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
};

const normalizeSlug = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const asArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

async function loadPostCategories(postId) {
  return query(
    `
    SELECT bc.*
    FROM blog_categories bc
    INNER JOIN blog_post_category_pivot bpcp
      ON bc.id = bpcp.category_id
    WHERE bpcp.blog_post_id = ?
    ORDER BY bc.display_order, bc.name
    `,
    [postId]
  );
}

// export const getAllPosts = async (req, res) => {
//   try {
//     const { category, limit = 20, offset = 0 } = req.query;

//     let sql = `
//       SELECT DISTINCT bp.*
//       FROM blog_posts bp
//       LEFT JOIN blog_post_category_pivot bpcp ON bp.id = bpcp.blog_post_id
//       LEFT JOIN blog_categories bc ON bc.id = bpcp.category_id
//       WHERE bp.published_at IS NOT NULL
//     `;
//     const params = [];

//     if (category) {
//       sql += " AND bc.slug = ?";
//       params.push(category);
//     }

//     sql += " ORDER BY bp.published_at DESC LIMIT ? OFFSET ?";
//     params.push(toInt(limit, 20), toInt(offset, 0));

//     const posts = await query(sql, params);
//     res.json({ posts });
//   } catch (error) {
//     console.error("Get blog posts error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

export const getAllPosts = async (req, res) => {
  try {
    const { category, limit = 20, offset = 0 } = req.query;

    let sql = `
      SELECT DISTINCT bp.*
      FROM blog_posts bp
      LEFT JOIN blog_post_category_pivot bpcp ON bp.id = bpcp.blog_post_id
      LEFT JOIN blog_categories bc ON bc.id = bpcp.category_id
      WHERE bp.published_at IS NOT NULL
    `;
    const params = [];

    if (category) {
      sql += " AND bc.slug = ?";
      params.push(category);
    }

    sql += " ORDER BY bp.published_at DESC LIMIT ? OFFSET ?";
    params.push(toInt(limit, 20), toInt(offset, 0));

    const posts = await query(sql, params);

    // --- AJOUT : Charger les catégories pour chaque post trouvé ---
    // Pour une liste paginée (20 items), faire une boucle async est acceptable.
    for (const post of posts) {
      post.categories = await loadPostCategories(post.id);
    }
    // -------------------------------------------------------------

    res.json({ posts });
  } catch (error) {
    console.error("Get blog posts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllPostsAdmin = async (req, res) => {
  try {
    const { status, category, search, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT DISTINCT bp.*
      FROM blog_posts bp
      LEFT JOIN blog_post_category_pivot bpcp ON bp.id = bpcp.blog_post_id
      LEFT JOIN blog_categories bc ON bc.id = bpcp.category_id
      WHERE 1=1
    `;
    const params = [];

    if (status === "published") sql += " AND bp.published_at IS NOT NULL";
    if (status === "draft") sql += " AND bp.published_at IS NULL";

    if (category) {
      sql += " AND bc.slug = ?";
      params.push(category);
    }

    if (search) {
      sql += " AND (bp.title LIKE ? OR bp.excerpt LIKE ? OR bp.content LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY bp.created_at DESC LIMIT ? OFFSET ?";
    params.push(toInt(limit, 50), toInt(offset, 0));

    const posts = await query(sql, params);
    res.json({ posts });
  } catch (error) {
    console.error("Get blog posts admin error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const posts = await query(
      `
      SELECT *
      FROM blog_posts
      WHERE slug = ? AND published_at IS NOT NULL
      `,
      [slug]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    const post = posts[0];

    await query("UPDATE blog_posts SET views = views + 1 WHERE id = ?", [
      post.id,
    ]);

    post.categories = await loadPostCategories(post.id);

    res.json({ post });
  } catch (error) {
    console.error("Get blog post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getPostByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await query("SELECT * FROM blog_posts WHERE id = ? LIMIT 1", [
      id,
    ]);
    if (!rows[0]) return res.status(404).json({ error: "Blog post not found" });

    const post = rows[0];
    post.categories = await loadPostCategories(post.id);

    res.json({ post });
  } catch (error) {
    console.error("Get blog post admin error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createPost = async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt = null,
      content,
      image_url = null,
      reading_time = 5,
      published_at = null, // allow draft if null
      category_ids = [], // array of blog_categories.id
    } = req.body ?? {};

    if (!title || !content) {
      return res
        .status(400)
        .json({ error: "title and content are required" });
    }

    const finalSlug = normalizeSlug(slug || title);
    if (!finalSlug) return res.status(400).json({ error: "Invalid slug" });

    const idRows = await query("SELECT UUID() AS id");
    const postId = idRows[0].id;

    // Ensure slug unique
    const existing = await query(
      "SELECT id FROM blog_posts WHERE slug = ? LIMIT 1",
      [finalSlug]
    );
    if (existing.length) {
      return res.status(409).json({ error: "Slug already exists" });
    }

    await query(
      `
      INSERT INTO blog_posts
        (id, title, slug, excerpt, content, image_url, reading_time, views, published_at)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, 0, ?)
      `,
      [
        postId,
        title,
        finalSlug,
        excerpt,
        content,
        image_url,
        toInt(reading_time, 5),
        published_at,
      ]
    );

    const ids = asArray(category_ids).filter(Boolean);
    if (ids.length) {
      // validate ids exist
      const found = await query(
        `SELECT id FROM blog_categories WHERE id IN (${ids
          .map(() => "?")
          .join(",")})`,
        ids
      );
      if (found.length !== ids.length) {
        return res
          .status(400)
          .json({ error: "One or more category_ids are invalid" });
      }

      await query(
        `
        INSERT INTO blog_post_category_pivot (blog_post_id, category_id)
        VALUES ${ids.map(() => "(?, ?)").join(",")}
        `,
        ids.flatMap((cid) => [postId, cid])
      );
    }

    const [post] = await query("SELECT * FROM blog_posts WHERE id = ?", [
      postId,
    ]);
    post.categories = await loadPostCategories(postId);

    res.status(201).json({ post });
  } catch (error) {
    console.error("Create blog post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query("SELECT * FROM blog_posts WHERE id = ? LIMIT 1", [
      id,
    ]);
    if (!existing[0]) return res.status(404).json({ error: "Blog post not found" });

    const {
      title,
      slug,
      excerpt,
      content,
      image_url,
      reading_time,
      published_at, // can set null (draft) or date
      category_ids, // optional: replace categories if provided
    } = req.body ?? {};

    const patch = [];
    const params = [];

    if (title !== undefined) {
      if (!title) return res.status(400).json({ error: "title cannot be empty" });
      patch.push("title = ?");
      params.push(title);
    }

    if (slug !== undefined) {
      const finalSlug = normalizeSlug(slug);
      if (!finalSlug) return res.status(400).json({ error: "Invalid slug" });

      const slugExists = await query(
        "SELECT id FROM blog_posts WHERE slug = ? AND id <> ? LIMIT 1",
        [finalSlug, id]
      );
      if (slugExists.length) return res.status(409).json({ error: "Slug already exists" });

      patch.push("slug = ?");
      params.push(finalSlug);
    }

    if (excerpt !== undefined) {
      patch.push("excerpt = ?");
      params.push(excerpt);
    }
    if (content !== undefined) {
      if (!content) return res.status(400).json({ error: "content cannot be empty" });
      patch.push("content = ?");
      params.push(content);
    }
    if (image_url !== undefined) {
      patch.push("image_url = ?");
      params.push(image_url);
    }
    if (reading_time !== undefined) {
      patch.push("reading_time = ?");
      params.push(toInt(reading_time, 5));
    }
    if (published_at !== undefined) {
      patch.push("published_at = ?");
      params.push(published_at);
    }

    if (patch.length) {
      await query(
        `UPDATE blog_posts SET ${patch.join(", ")} WHERE id = ?`,
        [...params, id]
      );
    }

    // Replace categories if provided
    if (category_ids !== undefined) {
      const ids = asArray(category_ids).filter(Boolean);

      if (ids.length) {
        const found = await query(
          `SELECT id FROM blog_categories WHERE id IN (${ids
            .map(() => "?")
            .join(",")})`,
          ids
        );
        if (found.length !== ids.length) {
          return res
            .status(400)
            .json({ error: "One or more category_ids are invalid" });
        }
      }

      await query("DELETE FROM blog_post_category_pivot WHERE blog_post_id = ?", [
        id,
      ]);

      if (ids.length) {
        await query(
          `
          INSERT INTO blog_post_category_pivot (blog_post_id, category_id)
          VALUES ${ids.map(() => "(?, ?)").join(",")}
          `,
          ids.flatMap((cid) => [id, cid])
        );
      }
    }

    const [post] = await query("SELECT * FROM blog_posts WHERE id = ?", [id]);
    post.categories = await loadPostCategories(id);

    res.json({ post });
  } catch (error) {
    console.error("Update blog post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await query("SELECT id FROM blog_posts WHERE id = ? LIMIT 1", [
      id,
    ]);
    if (!rows[0]) return res.status(404).json({ error: "Blog post not found" });

    // pivot rows are deleted by FK cascade, but safe to delete explicitly
    await query("DELETE FROM blog_post_category_pivot WHERE blog_post_id = ?", [
      id,
    ]);
    await query("DELETE FROM blog_posts WHERE id = ?", [id]);

    res.json({ success: true });
  } catch (error) {
    console.error("Delete blog post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const publishPost = async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await query("SELECT id FROM blog_posts WHERE id = ? LIMIT 1", [
      id,
    ]);
    if (!rows[0]) return res.status(404).json({ error: "Blog post not found" });

    await query("UPDATE blog_posts SET published_at = NOW() WHERE id = ?", [id]);

    const [post] = await query("SELECT * FROM blog_posts WHERE id = ?", [id]);
    post.categories = await loadPostCategories(id);

    res.json({ post });
  } catch (error) {
    console.error("Publish blog post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const unpublishPost = async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await query("SELECT id FROM blog_posts WHERE id = ? LIMIT 1", [
      id,
    ]);
    if (!rows[0]) return res.status(404).json({ error: "Blog post not found" });

    await query("UPDATE blog_posts SET published_at = NULL WHERE id = ?", [id]);

    const [post] = await query("SELECT * FROM blog_posts WHERE id = ?", [id]);
    post.categories = await loadPostCategories(id);

    res.json({ post });
  } catch (error) {
    console.error("Unpublish blog post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
