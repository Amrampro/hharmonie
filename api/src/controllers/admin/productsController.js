// api/src/controllers/admin/productsController.js
import { query } from '../../config/database.js';

export const getAllProducts = async (req, res) => {
  try {
    const { search, category, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      sql += ' AND p.category_id = ?';
      params.push(category);
    }

    sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const products = await query(sql, params);

    for (let product of products) {
      if (product.benefits && typeof product.benefits === 'string') {
        try {
          product.benefits = JSON.parse(product.benefits);
        } catch (e) {
          product.benefits = [];
        }
      }
    }

    const countSql = 'SELECT COUNT(*) as total FROM products';
    const countResult = await query(countSql);

    res.json({
      products,
      total: countResult[0].total
    });
  } catch (error) {
    console.error('Admin get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      shortDescription,
      price,
      compareAtPrice,
      imageUrl,
      categoryId,
      stockStatus,
      isFeatured,
      isNew,
      ingredients,
      usage,
      suitability,
      formulaBenefits,
      cureDuration,
      usageAdvice,
      composition,
      precautions,
      benefits
    } = req.body;

    if (!name || !slug || !price) {
      return res.status(400).json({ error: 'Name, slug, and price are required' });
    }

    const benefitsJson = Array.isArray(benefits) ? JSON.stringify(benefits) : '[]';

    await query(
      `INSERT INTO products (id, name, slug, description, short_description, price, compare_at_price,
       image_url, category_id, stock_status, is_featured, is_new, ingredients, \`usage\`, suitability,
       formula_benefits, cure_duration, usage_advice, composition, precautions, benefits)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        slug,
        description || '',
        shortDescription || '',
        price,
        compareAtPrice || null,
        imageUrl || '',
        categoryId || null,
        stockStatus || 'in_stock',
        isFeatured ? 1 : 0,
        isNew ? 1 : 0,
        ingredients || '',
        usage || '',
        suitability || '',
        formulaBenefits || '',
        cureDuration || '',
        usageAdvice || '',
        composition || '',
        precautions || '',
        benefitsJson
      ]
    );

    const products = await query('SELECT * FROM products WHERE slug = ? LIMIT 1', [slug]);

    res.status(201).json({
      message: 'Product created successfully',
      product: products[0]
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      shortDescription,
      price,
      compareAtPrice,
      imageUrl,
      categoryId,
      stockStatus,
      isFeatured,
      isNew,
      ingredients,
      usage,
      suitability,
      formulaBenefits,
      cureDuration,
      usageAdvice,
      composition,
      precautions,
      benefits
    } = req.body;

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (slug !== undefined) {
      updates.push('slug = ?');
      values.push(slug);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (shortDescription !== undefined) {
      updates.push('short_description = ?');
      values.push(shortDescription);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      values.push(price);
    }
    if (compareAtPrice !== undefined) {
      updates.push('compare_at_price = ?');
      values.push(compareAtPrice);
    }
    if (imageUrl !== undefined) {
      updates.push('image_url = ?');
      values.push(imageUrl);
    }
    if (categoryId !== undefined) {
      updates.push('category_id = ?');
      values.push(categoryId);
    }
    if (stockStatus !== undefined) {
      updates.push('stock_status = ?');
      values.push(stockStatus);
    }
    if (isFeatured !== undefined) {
      updates.push('is_featured = ?');
      values.push(isFeatured ? 1 : 0);
    }
    if (isNew !== undefined) {
      updates.push('is_new = ?');
      values.push(isNew ? 1 : 0);
    }
    if (ingredients !== undefined) {
      updates.push('ingredients = ?');
      values.push(ingredients);
    }
    if (usage !== undefined) {
      updates.push('`usage` = ?');
      values.push(usage);
    }
    if (suitability !== undefined) {
      updates.push('suitability = ?');
      values.push(suitability);
    }
    if (formulaBenefits !== undefined) {
      updates.push('formula_benefits = ?');
      values.push(formulaBenefits);
    }
    if (cureDuration !== undefined) {
      updates.push('cure_duration = ?');
      values.push(cureDuration);
    }
    if (usageAdvice !== undefined) {
      updates.push('usage_advice = ?');
      values.push(usageAdvice);
    }
    if (composition !== undefined) {
      updates.push('composition = ?');
      values.push(composition);
    }
    if (precautions !== undefined) {
      updates.push('precautions = ?');
      values.push(precautions);
    }
    if (benefits !== undefined) {
      updates.push('benefits = ?');
      values.push(Array.isArray(benefits) ? JSON.stringify(benefits) : '[]');
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    await query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, values);

    const products = await query('SELECT * FROM products WHERE id = ?', [id]);

    res.json({
      message: 'Product updated successfully',
      product: products[0]
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM products WHERE id = ?', [id]);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
