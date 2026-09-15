// api/src/services/email/ambassadorPayout.service.js
import { renderAmbassadorPayoutEmail } from "../../templates/ambassadorPayoutEmailTemplate.js";
import { mailer } from "../../config/mailer.js";
import { query } from "../../config/database.js";

export async function sendAmbassadorPayoutEmail({ ambassadorId, payout }) {
  const rows = await query(
    `
    SELECT a.id, a.code, a.iban, u.email, u.first_name, u.last_name
    FROM ambassadors a
    JOIN users u ON u.id = a.user_id
    WHERE a.id = ?
    LIMIT 1
    `,
    [ambassadorId],
  );

  const ambassador = rows?.[0];
  if (!ambassador?.email) return;

  const html = renderAmbassadorPayoutEmail({ ambassador, payout });

  await mailer.sendMail({
    to: ambassador.email,
    subject: `Paiement ambassadeur effectué (${ambassador.code})`,
    html,
  });
}