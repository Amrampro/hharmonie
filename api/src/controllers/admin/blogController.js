import { query } from '../../config/database.js';

export const getAllPosts = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const posts = await query(
      'SELECT * FROM blog_posts ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [parseInt(limit), parseInt(offset)]
    );

    res.json({ posts });
  } catch (error) {
    console.error('Admin get posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPost = async (req, res) => {
  try {
    const { title, slug, excerpt, content, imageUrl, category, readingTime, publishedAt } = req.body;

    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Title, slug, and content are required' });
    }

    const result = await query(
      `INSERT INTO blog_posts (title, slug, excerpt, content, image_url, category, reading_time, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, slug, excerpt || '', content, imageUrl || '', category || '', readingTime || 5, publishedAt || null]
    );

    const posts = await query('SELECT * FROM blog_posts WHERE id = ?', [result.insertId]);

    res.status(201).json({
      message: 'Blog post created successfully',
      post: posts[0]
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, excerpt, content, imageUrl, category, readingTime, publishedAt } = req.body;

    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (slug !== undefined) {
      updates.push('slug = ?');
      values.push(slug);
    }
    if (excerpt !== undefined) {
      updates.push('excerpt = ?');
      values.push(excerpt);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
    }
    if (imageUrl !== undefined) {
      updates.push('image_url = ?');
      values.push(imageUrl);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }
    if (readingTime !== undefined) {
      updates.push('reading_time = ?');
      values.push(readingTime);
    }
    if (publishedAt !== undefined) {
      updates.push('published_at = ?');
      values.push(publishedAt);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    await query(`UPDATE blog_posts SET ${updates.join(', ')} WHERE id = ?`, values);

    const posts = await query('SELECT * FROM blog_posts WHERE id = ?', [id]);

    res.json({
      message: 'Blog post updated successfully',
      post: posts[0]
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM blog_posts WHERE id = ?', [id]);

    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
