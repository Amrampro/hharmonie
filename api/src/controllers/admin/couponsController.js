import { query } from '../../config/database.js';

export const getAllCoupons = async (req, res) => {
  try {
    const { active, limit = 50, offset = 0 } = req.query;

    let sql = 'SELECT * FROM coupons WHERE 1=1';
    const params = [];

    if (active !== undefined) {
      sql += ' AND is_active = ?';
      params.push(active === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const coupons = await query(sql, params);

    res.json({ coupons });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      validFrom,
      validUntil,
      usageLimitPerUser,
      totalUsageLimit,
      isActive,
      requiresFirstOrder,
      requiresMinOrders
    } = req.body;

    if (!code || !description || !discountType || discountValue === undefined) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const result = await query(
      `INSERT INTO coupons (id, code, description, discount_type, discount_value, min_purchase_amount,
       max_discount_amount, valid_from, valid_until, usage_limit_per_user, total_usage_limit,
       is_active, requires_first_order, requires_min_orders)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code.toUpperCase(),
        description,
        discountType,
        discountValue,
        minPurchaseAmount || 0,
        maxDiscountAmount || null,
        validFrom || new Date(),
        validUntil || null,
        usageLimitPerUser || 1,
        totalUsageLimit || null,
        isActive !== false ? 1 : 0,
        requiresFirstOrder ? 1 : 0,
        requiresMinOrders || 0
      ]
    );

    const coupons = await query('SELECT * FROM coupons WHERE code = ? LIMIT 1', [code.toUpperCase()]);

    res.status(201).json({
      message: 'Coupon created successfully',
      coupon: coupons[0]
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      description,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      validFrom,
      validUntil,
      usageLimitPerUser,
      totalUsageLimit,
      isActive,
      requiresFirstOrder,
      requiresMinOrders
    } = req.body;

    const updates = [];
    const values = [];

    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (discountValue !== undefined) {
      updates.push('discount_value = ?');
      values.push(discountValue);
    }
    if (minPurchaseAmount !== undefined) {
      updates.push('min_purchase_amount = ?');
      values.push(minPurchaseAmount);
    }
    if (maxDiscountAmount !== undefined) {
      updates.push('max_discount_amount = ?');
      values.push(maxDiscountAmount);
    }
    if (validFrom !== undefined) {
      updates.push('valid_from = ?');
      values.push(validFrom);
    }
    if (validUntil !== undefined) {
      updates.push('valid_until = ?');
      values.push(validUntil);
    }
    if (usageLimitPerUser !== undefined) {
      updates.push('usage_limit_per_user = ?');
      values.push(usageLimitPerUser);
    }
    if (totalUsageLimit !== undefined) {
      updates.push('total_usage_limit = ?');
      values.push(totalUsageLimit);
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(isActive ? 1 : 0);
    }
    if (requiresFirstOrder !== undefined) {
      updates.push('requires_first_order = ?');
      values.push(requiresFirstOrder ? 1 : 0);
    }
    if (requiresMinOrders !== undefined) {
      updates.push('requires_min_orders = ?');
      values.push(requiresMinOrders);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    await query(`UPDATE coupons SET ${updates.join(', ')} WHERE id = ?`, values);

    const coupons = await query('SELECT * FROM coupons WHERE id = ?', [id]);

    res.json({
      message: 'Coupon updated successfully',
      coupon: coupons[0]
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM coupons WHERE id = ?', [id]);

    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
