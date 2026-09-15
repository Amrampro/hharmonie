import { query } from '../config/database.js';

export const validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    const userId = req.user.id;

    if (!code || cartTotal === undefined) {
      return res.status(400).json({ error: 'Code and cart total are required' });
    }

    const coupons = await query(
      'SELECT * FROM coupons WHERE code = ? AND is_active = 1',
      [code.toUpperCase()]
    );

    if (coupons.length === 0) {
      return res.status(404).json({ error: 'Invalid coupon code' });
    }

    const coupon = coupons[0];
    const now = new Date();

    if (new Date(coupon.valid_from) > now) {
      return res.status(400).json({ error: 'Coupon is not yet valid' });
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }

    if (coupon.min_purchase_amount && cartTotal < coupon.min_purchase_amount) {
      return res.status(400).json({
        error: `Minimum purchase amount of €${coupon.min_purchase_amount} required`
      });
    }

    const usageCount = await query(
      'SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
      [coupon.id, userId]
    );

    if (usageCount[0].count >= coupon.usage_limit_per_user) {
      return res.status(400).json({ error: 'You have already used this coupon' });
    }

    if (coupon.requires_first_order) {
      const orderCount = await query(
        'SELECT COUNT(*) as count FROM orders WHERE user_id = ?',
        [userId]
      );

      if (orderCount[0].count > 0) {
        return res.status(400).json({ error: 'This coupon is only for first-time customers' });
      }
    }

    if (coupon.requires_min_orders > 0) {
      const orderCount = await query(
        'SELECT COUNT(*) as count FROM orders WHERE user_id = ?',
        [userId]
      );

      if (orderCount[0].count < coupon.requires_min_orders) {
        return res.status(400).json({
          error: `This coupon requires at least ${coupon.requires_min_orders} previous order(s)`
        });
      }
    }

    if (coupon.total_usage_limit && coupon.current_usage_count >= coupon.total_usage_limit) {
      return res.status(400).json({ error: 'This coupon has reached its usage limit' });
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (cartTotal * coupon.discount_value) / 100;
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount;
      }
    } else {
      discountAmount = coupon.discount_value;
    }

    discountAmount = Math.min(discountAmount, cartTotal);

    res.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discountAmount
      }
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
