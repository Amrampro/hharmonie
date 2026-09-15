// api/src/templates/ambassadorPayoutEmailTemplate.js
function money(cents, currency = "EUR") {
  const v = Number(cents || 0) / 100;
  try {
    return new Intl.NumberFormat("fr-BE", { style: "currency", currency }).format(v);
  } catch {
    return `${v.toFixed(2)} ${currency}`;
  }
}

export function renderAmbassadorPayoutEmail({ ambassador, payout }) {
  const colorDark = "#113D23";
  const colorBg = "#F4F6F4";

  return `
  <!doctype html>
  <html lang="fr">
  <body style="margin:0; padding:0; background:${colorBg}; font-family:Arial, sans-serif;">
    <div style="max-width:640px; margin:0 auto; padding:24px;">
      <div style="background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,.06);">
        <div style="background:${colorDark}; padding:20px; color:#fff;">
          <h2 style="margin:0;">Paiement ambassadeur effectué</h2>
          <div style="opacity:.9; margin-top:6px;">NOVEDEN</div>
        </div>

        <div style="padding:20px; color:#222;">
          <p style="margin-top:0;">
            Bonjour <b>${ambassador?.first_name || ""} ${ambassador?.last_name || ""}</b>,
          </p>

          <p>
            L’administration confirme avoir effectué un virement sur le compte bancaire (IBAN) que vous avez enregistré :
            <br/>
            <b style="font-family:monospace;">${ambassador?.iban || "-"}</b>
          </p>

          <div style="background:#f7f7f7; padding:14px; border-radius:8px; border:1px solid #eee;">
            <div><b>Montant :</b> ${money(payout?.amount, payout?.currency || "EUR")}</div>
            <div><b>Date :</b> ${payout?.paid_at ? new Date(payout.paid_at).toLocaleString("fr-BE") : "-"}</div>
            ${payout?.note ? `<div><b>Note :</b> ${payout.note}</div>` : ""}
          </div>

          <p style="margin-bottom:0;">
            Vous pouvez consulter l’historique dans votre dashboard ambassadeur.
          </p>
        </div>

        <div style="padding:16px; text-align:center; color:#888; font-size:12px; border-top:1px solid #eee;">
          Ceci est un e-mail automatique.
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}