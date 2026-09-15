// api/src/services/admin/adminFinance.service.js
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

export function assertEnum(value, allowed, fieldName) {
  if (value == null || value === "") return;
  if (!allowed.includes(value)) {
    const err = new Error(`Invalid ${fieldName}`);
    err.statusCode = 400;
    err.details = { field: fieldName, allowed };
    throw err;
  }
}

export const adminFinanceService = {
  async list({
    status,
    shipping_method,
    q,
    date_from,
    date_to,
    limit = 50,
    offset = 0,
  }) {
    limit = Math.min(Math.max(toInt(limit, 50), 1), 200);
    offset = Math.max(toInt(offset, 0), 0);

    if (status) assertEnum(status, ORDER_STATUSES, "status");
    if (shipping_method) assertEnum(shipping_method, SHIPPING_METHODS, "shipping_method");

    // --------- LIST ----------
    let sql = `
      SELECT
        o.*,
        oa.full_name as customer_full_name,
        oa.email as customer_email,
        oa.phone as customer_phone
      FROM orders o
      LEFT JOIN order_addresses oa ON oa.order_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += " AND o.status = ?";
      params.push(status);
    }

    if (shipping_method) {
      sql += " AND o.shipping_method = ?";
      params.push(shipping_method);
    }

    if (q) {
      sql += " AND (o.id LIKE ? OR o.coupon_code LIKE ? OR oa.email LIKE ? OR oa.full_name LIKE ?)";
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    if (date_from) {
      sql += " AND o.created_at >= ?";
      params.push(date_from);
    }
    if (date_to) {
      sql += " AND o.created_at <= ?";
      params.push(date_to);
    }

    sql += " ORDER BY o.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const orders = await query(sql, params);

    // --------- COUNT ----------
    let countSql = `
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN order_addresses oa ON oa.order_id = o.id
      WHERE 1=1
    `;
    const countParams = [];

    if (status) { countSql += " AND o.status = ?"; countParams.push(status); }
    if (shipping_method) { countSql += " AND o.shipping_method = ?"; countParams.push(shipping_method); }

    if (q) {
      countSql += " AND (o.id LIKE ? OR o.coupon_code LIKE ? OR oa.email LIKE ? OR oa.full_name LIKE ?)";
      countParams.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    if (date_from) { countSql += " AND o.created_at >= ?"; countParams.push(date_from); }
    if (date_to) { countSql += " AND o.created_at <= ?"; countParams.push(date_to); }

    const [{ total }] = await query(countSql, countParams);

    // --------- STATS / KPI ----------
    let statsSql = `
      SELECT
        SUM(CASE WHEN o.status='paid' THEN o.total_amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN o.status='refunded' THEN o.total_amount ELSE 0 END) as total_refunded,
        SUM(CASE WHEN o.status='pending_payment' THEN o.total_amount ELSE 0 END) as total_pending_payment,
        SUM(CASE WHEN o.status IN ('processing','shipped') THEN o.total_amount ELSE 0 END) as total_in_progress,
        SUM(CASE WHEN o.status='delivered' THEN o.total_amount ELSE 0 END) as total_delivered,
        SUM(CASE WHEN o.status='cancelled' THEN o.total_amount ELSE 0 END) as total_cancelled,

        COUNT(*) as count_all,
        SUM(CASE WHEN o.status='paid' THEN 1 ELSE 0 END) as count_paid,
        SUM(CASE WHEN o.status='refunded' THEN 1 ELSE 0 END) as count_refunded,
        SUM(CASE WHEN o.status='pending_payment' THEN 1 ELSE 0 END) as count_pending_payment,
        SUM(CASE WHEN o.status IN ('processing','shipped') THEN 1 ELSE 0 END) as count_in_progress,
        SUM(CASE WHEN o.status='delivered' THEN 1 ELSE 0 END) as count_delivered,
        SUM(CASE WHEN o.status='cancelled' THEN 1 ELSE 0 END) as count_cancelled
      FROM orders o
      LEFT JOIN order_addresses oa ON oa.order_id = o.id
      WHERE 1=1
    `;
    const statsParams = [];

    // mêmes filtres (sans pagination)
    if (status) { statsSql += " AND o.status = ?"; statsParams.push(status); }
    if (shipping_method) { statsSql += " AND o.shipping_method = ?"; statsParams.push(shipping_method); }
    if (q) {
      statsSql += " AND (o.id LIKE ? OR o.coupon_code LIKE ? OR oa.email LIKE ? OR oa.full_name LIKE ?)";
      statsParams.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (date_from) { statsSql += " AND o.created_at >= ?"; statsParams.push(date_from); }
    if (date_to) { statsSql += " AND o.created_at <= ?"; statsParams.push(date_to); }

    const [statsRow] = await query(statsSql, statsParams);
    const stats = statsRow || {};

    // ✅ Solde actuel selon ta règle => total des "paid"
    const balance_current = Number(stats.total_paid || 0);
    const total_out = Number(stats.total_refunded || 0);
    const net = balance_current - total_out;

    return {
      orders,
      total,
      limit,
      offset,
      stats: {
        ...stats,
        balance_current,
        total_out,
        net,
      },
    };
  },
};
