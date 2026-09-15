// api/src/services/admin/adminOrders.service.js
import { query } from "../../config/database.js";

const toInt = (v, def) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
};

export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

export const SHIPPING_METHODS = ["mondial_relay", "home_delivery"];

export const SHIPPING_STATUSES = [
  "not_set",
  "label_created",
  "in_transit",
  "delivered",
  "returned",
];

export function assertEnum(value, allowed, fieldName) {
  if (value == null) return;
  if (!allowed.includes(value)) {
    const err = new Error(`Invalid ${fieldName}`);
    err.statusCode = 400;
    err.details = { field: fieldName, allowed };
    throw err;
  }
}

export const adminOrdersService = {
  async list({ status, shipping_status, shipping_method, q, limit = 50, offset = 0 }) {
    limit = Math.min(Math.max(toInt(limit, 50), 1), 200);
    offset = Math.max(toInt(offset, 0), 0);

    let sql = `
      SELECT 
        o.*,
        oa.full_name as customer_full_name,
        oa.email as customer_email,
        oa.phone as customer_phone,
        op.status as payment_status,
        op.provider as payment_provider
      FROM orders o
      LEFT JOIN order_addresses oa ON oa.order_id = o.id
      LEFT JOIN order_payments op ON op.order_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      assertEnum(status, ORDER_STATUSES, "status");
      sql += " AND o.status = ?";
      params.push(status);
    }

    if (shipping_status) {
      assertEnum(shipping_status, SHIPPING_STATUSES, "shipping_status");
      sql += " AND o.shipping_status = ?";
      params.push(shipping_status);
    }

    if (shipping_method) {
      assertEnum(shipping_method, SHIPPING_METHODS, "shipping_method");
      sql += " AND o.shipping_method = ?";
      params.push(shipping_method);
    }

    if (q) {
      sql += " AND (o.id LIKE ? OR o.coupon_code LIKE ? OR oa.email LIKE ? OR oa.full_name LIKE ?)";
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    sql += " ORDER BY o.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const rawOrders = await query(sql, params);

    // Dedup in case joins cause duplicates
    const uniqueMap = new Map();
    for (const o of rawOrders) {
      if (!uniqueMap.has(o.id)) uniqueMap.set(o.id, o);
    }
    const orders = Array.from(uniqueMap.values());

    // Items
    const ids = orders.map((o) => o.id);
    const itemsByOrderId = new Map();

    if (ids.length) {
      const placeholders = ids.map(() => "?").join(",");
      const items = await query(
        `SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY created_at ASC`,
        ids
      );

      for (const it of items) {
        if (!itemsByOrderId.has(it.order_id)) itemsByOrderId.set(it.order_id, []);
        itemsByOrderId.get(it.order_id).push(it);
      }
    }

    for (const o of orders) {
      o.items = itemsByOrderId.get(o.id) ?? [];
    }

    // Count
    let countSql = `
      SELECT COUNT(DISTINCT o.id) as total
      FROM orders o
      LEFT JOIN order_addresses oa ON oa.order_id = o.id
      WHERE 1=1
    `;
    const countParams = [];

    if (status) { countSql += " AND o.status = ?"; countParams.push(status); }
    if (shipping_status) { countSql += " AND o.shipping_status = ?"; countParams.push(shipping_status); }
    if (shipping_method) { countSql += " AND o.shipping_method = ?"; countParams.push(shipping_method); }
    if (q) {
      countSql += " AND (o.id LIKE ? OR o.coupon_code LIKE ? OR oa.email LIKE ? OR oa.full_name LIKE ?)";
      countParams.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    const [{ total }] = await query(countSql, countParams);

    return { orders, total, limit, offset };
  },

  async getById(orderId) {
    const rows = await query(
      `
      SELECT 
        o.*,
        oa.full_name as customer_full_name,
        oa.email as customer_email,
        oa.phone as customer_phone,
        op.status as payment_status,
        op.provider as payment_provider,
        op.stripe_payment_intent_id,
        op.stripe_charge_id,
        op.stripe_checkout_session_id
      FROM orders o
      LEFT JOIN order_addresses oa ON oa.order_id = o.id
      LEFT JOIN order_payments op ON op.order_id = o.id
      WHERE o.id = ?
      LIMIT 1
      `,
      [orderId]
    );

    if (!rows.length) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }

    const order = rows[0];

    const items = await query(
      "SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC",
      [orderId]
    );

    const addressRows = await query(
      "SELECT * FROM order_addresses WHERE order_id = ? LIMIT 1",
      [orderId]
    );

    const paymentRows = await query(
      "SELECT * FROM order_payments WHERE order_id = ? LIMIT 1",
      [orderId]
    );

    order.items = items;
    order.address = addressRows[0] ?? null;
    order.payment = paymentRows[0] ?? null;

    return order;
  },

  async updateStatus(orderId, status) {
    assertEnum(status, ORDER_STATUSES, "status");
    await query("UPDATE orders SET status = ? WHERE id = ?", [status, orderId]);
    return this.getById(orderId);
  },

  async updateShipping(orderId, payload) {
    const { shipping_method, shipping_status, shipping_tracking_number, shipping_tracking_url } = payload;

    if (shipping_method != null) assertEnum(shipping_method, SHIPPING_METHODS, "shipping_method");
    if (shipping_status != null) assertEnum(shipping_status, SHIPPING_STATUSES, "shipping_status");

    const fields = [];
    const params = [];

    if (shipping_method !== undefined) { fields.push("shipping_method = ?"); params.push(shipping_method); }
    if (shipping_status !== undefined) { fields.push("shipping_status = ?"); params.push(shipping_status); }
    if (shipping_tracking_number !== undefined) { fields.push("shipping_tracking_number = ?"); params.push(shipping_tracking_number || null); }
    if (shipping_tracking_url !== undefined) { fields.push("shipping_tracking_url = ?"); params.push(shipping_tracking_url || null); }

    if (!fields.length) {
      const err = new Error("No shipping fields provided");
      err.statusCode = 400;
      throw err;
    }

    params.push(orderId);
    await query(`UPDATE orders SET ${fields.join(", ")} WHERE id = ?`, params);

    return this.getById(orderId);
  },

  async delete(orderId) {
    await query("DELETE FROM orders WHERE id = ?", [orderId]);
    return true;
  },
};
