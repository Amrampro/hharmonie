// api/src/utils/ambassadors/commission.js
export function computeCommissionCents({
  commission_type,
  commission_value,
  subtotal_amount_cents,
}) {
  const type = commission_type || "percentage";
  const val = Number(commission_value || 0);

  if (subtotal_amount_cents <= 0 || val <= 0) return 0;

  if (type === "fixed") {
    // commission_value est en EUR dans la DB -> convertir en cents
    return Math.max(0, Math.round(val * 100));
  }

  // percentage
  return Math.max(0, Math.round(subtotal_amount_cents * (val / 100)));
}