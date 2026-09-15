// api/src/services/ambassadors/ambassadors.service.js
import { query, getConnection } from "../../config/database.js";
import crypto from "node:crypto";
import { computeCommissionCents } from "../../utils/ambassadors/commission.js";

export async function findActiveAmbassadorByCode(code) {
  const safe = String(code || "").trim();
  if (!safe) return null;

  const rows = await query(
    `SELECT * FROM ambassadors WHERE code = ? AND is_active = 1 LIMIT 1`,
    [safe],
  );

  return rows?.[0] ?? null;
}

export async function computeAmbassadorDueCents(ambassadorId) {
  const [row1] = await query(
    `
    SELECT COALESCE(SUM(o.ambassador_commission_amount),0) AS total_commission
    FROM orders o
    WHERE o.ambassador_id = ?
      AND o.status IN ('paid','processing','shipped','delivered')
    `,
    [ambassadorId],
  );

  const [row2] = await query(
    `
    SELECT COALESCE(SUM(p.amount),0) AS total_paid
    FROM ambassador_payouts p
    WHERE p.ambassador_id = ?
    `,
    [ambassadorId],
  );

  const totalCommission = Number(row1?.total_commission || 0);
  const totalPaid = Number(row2?.total_paid || 0);
  return Math.max(0, totalCommission - totalPaid);
}

export async function listAmbassadorsAdmin({ search = "", limit = 50, offset = 0 }) {
  const params = [];
  let where = "WHERE 1=1";

  if (search) {
    where += " AND (a.code LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  const ambassadors = await query(
    `
    SELECT
      a.id, a.code, a.commission_type, a.commission_value, a.iban, a.bank_account_name, a.is_active,
      a.created_at,
      u.id AS user_id, u.email, u.first_name, u.last_name, u.phone
    FROM ambassadors a
    JOIN users u ON u.id = a.user_id
    ${where}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [...params, Number(limit), Number(offset)],
  );

  // enrich with due
  const enriched = [];
  for (const a of ambassadors) {
    const due = await computeAmbassadorDueCents(a.id);
    enriched.push({ ...a, due_amount: due, currency: "EUR" });
  }

  const count = await query(
    `
    SELECT COUNT(*) AS total
    FROM ambassadors a
    JOIN users u ON u.id = a.user_id
    ${where}
    `,
    params,
  );

  return { ambassadors: enriched, total: Number(count?.[0]?.total || 0) };
}

export async function createPayoutAdmin({
  ambassadorId,
  amount,
  adminUserId = null,
  note = null,
}) {
  const amt = Math.max(0, Math.round(Number(amount || 0)));
  if (!ambassadorId) throw new Error("ambassadorId is required");
  if (amt <= 0) throw new Error("amount must be > 0");

  const ambassadorRows = await query(`SELECT * FROM ambassadors WHERE id = ? LIMIT 1`, [ambassadorId]);
  const ambassador = ambassadorRows?.[0];
  if (!ambassador) throw new Error("Ambassador not found");

  const due = await computeAmbassadorDueCents(ambassadorId);
  if (amt > due) {
    const err = new Error("Amount exceeds due amount");
    err.statusCode = 400;
    err.details = { due };
    throw err;
  }

  const payoutId = crypto.randomUUID();

  await query(
    `
    INSERT INTO ambassador_payouts
      (id, ambassador_id, amount, currency, paid_at, created_by_admin_id, note, created_at)
    VALUES
      (?, ?, ?, 'EUR', NOW(), ?, ?, NOW())
    `,
    [payoutId, ambassadorId, amt, adminUserId, note],
  );

  const payouts = await query(`SELECT * FROM ambassador_payouts WHERE id = ? LIMIT 1`, [payoutId]);
  return payouts?.[0] ?? null;
}

export function computeCommissionForOrderSnapshot(ambassador, subtotal_amount) {
  const commission = computeCommissionCents({
    commission_type: ambassador?.commission_type,
    commission_value: ambassador?.commission_value,
    subtotal_amount_cents: subtotal_amount,
  });

  return commission;
}