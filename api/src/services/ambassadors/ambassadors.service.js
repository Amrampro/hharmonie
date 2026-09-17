// api/src/services/ambassadors/ambassadors.service.js
import { query, getConnection } from "../../config/database.js";
import crypto from "node:crypto";
import { computeCommissionCents } from "../../utils/ambassadors/commission.js";
import { releaseTransaction } from "../../utils/transaction.js";

export async function findActiveAmbassadorByCode(code) {
  const safe = String(code || "").trim();
  if (!safe) return null;

  const rows = await query(
    `SELECT * FROM ambassadors WHERE code = ? AND is_active = 1 LIMIT 1`,
    [safe],
  );

  return rows?.[0] ?? null;
}

export async function computeAmbassadorDueCents(ambassadorId, execute = query) {
  const [row1] = await execute(
    `
    SELECT COALESCE(SUM(o.ambassador_commission_amount),0) AS total_commission
    FROM orders o
    WHERE o.ambassador_id = ?
      AND o.status IN ('paid','processing','shipped','delivered')
    `,
    [ambassadorId],
  );

  const [row2] = await execute(
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
  const amt = Number(amount);
  if (!ambassadorId || !Number.isSafeInteger(amt) || amt <= 0 || amt > 2147483647) {
    throw Object.assign(new Error("Le montant doit être un nombre entier positif de centimes."), { statusCode: 400 });
  }
  let connection;
  let committed = false;
  try {
    connection = await getConnection();
    await connection.beginTransaction();
    const execute = async (sql, params = []) => (await connection.execute(sql, params))[0];
    // Serialize payouts for the same ambassador before reading the outstanding balance.
    const [ambassador] = await execute("SELECT id FROM ambassadors WHERE id = ? FOR UPDATE", [ambassadorId]);
    if (!ambassador) throw Object.assign(new Error("Ambassador not found"), { statusCode: 404 });
    const due = await computeAmbassadorDueCents(ambassadorId, execute);
    if (amt > due) {
      throw Object.assign(new Error("Amount exceeds due amount"), { statusCode: 400, details: { due } });
    }
    const payoutId = crypto.randomUUID();
    await execute(
      `INSERT INTO ambassador_payouts
        (id, ambassador_id, amount, currency, paid_at, created_by_admin_id, note, created_at)
       VALUES (?, ?, ?, 'EUR', NOW(), ?, ?, NOW())`,
      [payoutId, ambassadorId, amt, adminUserId, note]
    );
    const [payout] = await execute("SELECT * FROM ambassador_payouts WHERE id = ? LIMIT 1", [payoutId]);
    await connection.commit();
    committed = true;
    return payout;
  } finally {
    await releaseTransaction(connection, committed);
  }
}

export function computeCommissionForOrderSnapshot(ambassador, subtotal_amount) {
  const commission = computeCommissionCents({
    commission_type: ambassador?.commission_type,
    commission_value: ambassador?.commission_value,
    subtotal_amount_cents: subtotal_amount,
  });

  return commission;
}
