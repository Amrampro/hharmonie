// api/src/controllers/adminOrders.controller.js
import { getConnection } from "../config/database.js";

const toInt = (v, def = 0) => {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
};

export async function adminListOrders(req, res) {
  const status = req.query.status ? String(req.query.status) : null;
  const limit = Math.min(toInt(req.query.limit, 50), 200);
  const offset = Math.max(toInt(req.query.offset, 0), 0);

  const connection = await getConnection();
  try {
    const where = [];
    const params = [];

    if (status) {
      where.push("o.status = ?");
      params.push(status);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await connection.execute(
      `
      SELECT
        o.id,
        o.user_id,
        o.status,
        o.payment_status,
        o.total_amount,
        o.currency,
        o.shipping_method,
        o.shipping_tracking_code,
        o.created_at,
        o.updated_at
      FROM orders o
      ${whereSql}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    return res.json({ orders: rows || [] });
  } catch (e) {
    console.error("adminListOrders error:", e);
    return res.status(500).json({ error: "Failed to list orders" });
  } finally {
    connection.release();
  }
}

export async function adminGetOrderById(req, res) {
  const { id } = req.params;

  const connection = await getConnection();
  try {
    const [[order]] = await connection.execute(
      `SELECT * FROM orders WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!order) return res.status(404).json({ error: "Order not found" });

    const [items] = await connection.execute(
      `SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC`,
      [id]
    );

    const [[address]] = await connection.execute(
      `SELECT * FROM order_addresses WHERE order_id = ? LIMIT 1`,
      [id]
    );

    return res.json({ order: { ...order, items: items || [], address: address || null } });
  } catch (e) {
    console.error("adminGetOrderById error:", e);
    return res.status(500).json({ error: "Failed to read order" });
  } finally {
    connection.release();
  }
}

export async function adminUpdateOrderShipping(req, res) {
  const { id } = req.params;
  const shipping_method = req.body?.shipping_method ?? null;
  const shipping_tracking_code = req.body?.shipping_tracking_code ?? null;

  const connection = await getConnection();
  try {
    const [[exists]] = await connection.execute(
      `SELECT id FROM orders WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!exists) return res.status(404).json({ error: "Order not found" });

    await connection.execute(
      `
      UPDATE orders
      SET shipping_method = ?,
          shipping_tracking_code = ?,
          updated_at = NOW()
      WHERE id = ?
      `,
      [shipping_method, shipping_tracking_code, id]
    );

    const [[order]] = await connection.execute(
      `SELECT * FROM orders WHERE id = ? LIMIT 1`,
      [id]
    );

    return res.json({ order });
  } catch (e) {
    console.error("adminUpdateOrderShipping error:", e);
    return res.status(500).json({ error: "Failed to update shipping" });
  } finally {
    connection.release();
  }
}

export async function adminUpdateOrderStatus(req, res) {
  const { id } = req.params;
  const status = req.body?.status ? String(req.body.status) : null;

  if (!status) return res.status(400).json({ error: "status is required" });

  const connection = await getConnection();
  try {
    const [[exists]] = await connection.execute(
      `SELECT id FROM orders WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!exists) return res.status(404).json({ error: "Order not found" });

    await connection.execute(
      `
      UPDATE orders
      SET status = ?,
          updated_at = NOW()
      WHERE id = ?
      `,
      [status, id]
    );

    const [[order]] = await connection.execute(
      `SELECT * FROM orders WHERE id = ? LIMIT 1`,
      [id]
    );

    return res.json({ order });
  } catch (e) {
    console.error("adminUpdateOrderStatus error:", e);
    return res.status(500).json({ error: "Failed to update status" });
  } finally {
    connection.release();
  }
}
