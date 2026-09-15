// api/src/templates/adminOrderNotificationEmailTemplate.js

// --- Fonctions utilitaires ---

function money(cents, currency = "EUR") {
  const v = (Number(cents || 0) / 100);
  try {
    return new Intl.NumberFormat("fr-BE", { style: "currency", currency }).format(v);
  } catch {
    return `${v.toFixed(2)} ${currency}`;
  }
}

function labelStatus(s) {
  const map = {
    pending_payment: "En attente de paiement",
    paid: "Payée",
    processing: "En préparation",
    shipped: "Expédiée",
    delivered: "Livrée",
    cancelled: "Annulée",
    refunded: "Remboursée",
  };
  return map[s] || s || "-";
}

function labelShippingStatus(s) {
  const map = {
    not_set: "Non défini",
    label_created: "Étiquette créée",
    in_transit: "En transit",
    delivered: "Livré",
    returned: "Retourné",
  };
  return map[s] || s || "-";
}

function labelShippingMethod(s) {
  const map = {
    mondial_relay: "Mondial Relay",
    home_delivery: "Livraison à domicile",
  };
  return map[s] || s || "-";
}

// Fonction pour générer une ligne du tableau de modifications
function row(label, before, after, colorDark) {
  const b = (before ?? "-");
  const a = (after ?? "-");
  return `
    <tr>
      <td style="padding:10px; border-bottom:1px solid #eee; color:#666; font-size:13px;">${label}</td>
      <td style="padding:10px; border-bottom:1px solid #eee; color:#888; font-size:13px;">${b}</td>
      <td style="padding:10px; border-bottom:1px solid #eee; color:${colorDark}; font-weight:bold; font-size:13px;">${a}</td>
    </tr>
  `;
}

// --- Template Principal ---

export function renderAdminOrderNotificationEmail({
  action, // "update_shipping" | "update_status" | "deleted"
  orderBefore,
  orderAfter,
  address,
  changes, // array of { label, before, after }
}) {
  const order = orderAfter || orderBefore;
  
  // Couleurs de la marque
  const colorDark = "#113D23";
  const colorLight = "#A8B89F";
  const colorBg = "#F4F6F4";

  // Textes dynamiques selon l'action
  const title =
    action === "deleted"
      ? "Commande annulée"
      : action === "update_status"
      ? "Le statut de votre commande a changé"
      : "Mise à jour de la livraison";

  const intro =
    action === "deleted"
      ? "Votre commande a été supprimée de notre système. Si vous pensez qu’il s’agit d’une erreur, répondez à cet email."
      : "Nous vous informons qu’une mise à jour a été effectuée sur votre commande.";

  // Génération des lignes de changement
  const changeRows = (changes || [])
    .map((c) => row(c.label, c.before, c.after, colorDark))
    .join("");

  return `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Mise à jour commande NOVEDEN</title>
  </head>
  <body style="margin:0; padding:0; background-color:${colorBg}; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
    
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:${colorBg}; padding: 20px 0;">
      <tr>
        <td align="center">
          
          <div style="max-width:600px; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            
            <div style="background-color:${colorDark}; padding:30px 20px; text-align:center;">
              <a href="https://www.noveden.com" style="text-decoration:none;">
                <h1 style="color:#ffffff; margin:0; font-size:28px; letter-spacing:1px; text-transform:uppercase;">NOVEDEN</h1>
              </a>
              <p style="color:${colorLight}; margin:5px 0 0; font-size:14px; font-style:italic;">la beauté authentique</p>
            </div>

            <div style="padding:30px 20px;">
              
              <div style="text-align:center; margin-bottom:25px;">
                <h2 style="color:${colorDark}; margin:0 0 10px 0; font-size:20px;">${title}</h2>
                <div style="font-size:14px; color:#666;">
                   Commande n° <strong>${order?.id || "-"}</strong><br/>
                   <span style="font-size:12px; color:#888;">${order?.created_at ? new Date(order.created_at).toLocaleString("fr-BE") : "-"}</span>
                </div>
                <p style="margin:20px 0 0 0; color:#333; line-height:1.5;">${intro}</p>
              </div>

              <div style="background-color:#fafafa; border-left:4px solid ${colorDark}; padding:15px; border-radius:4px; margin-bottom:25px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding:4px 0; color:#666; font-size:13px;">Statut commande</td>
                        <td style="padding:4px 0; text-align:right; font-weight:bold; color:${colorDark};">${labelStatus(order?.status)}</td>
                    </tr>
                    <tr>
                        <td style="padding:4px 0; color:#666; font-size:13px;">Mode de livraison</td>
                        <td style="padding:4px 0; text-align:right; color:#333;">${labelShippingMethod(order?.shipping_method)}</td>
                    </tr>
                    <tr>
                        <td style="padding:4px 0; color:#666; font-size:13px;">Statut livraison</td>
                        <td style="padding:4px 0; text-align:right; color:#333;">${labelShippingStatus(order?.shipping_status)}</td>
                    </tr>
                    <tr>
                        <td style="padding:4px 0; color:#666; font-size:13px;">Numéro de suivi</td>
                        <td style="padding:4px 0; text-align:right; color:#333; font-family:monospace;">${order?.shipping_tracking_number || "-"}</td>
                    </tr>
                </table>
              </div>

              ${order?.shipping_tracking_url ? `
              <div style="text-align:center; margin-bottom:30px;">
                <a href="${order.shipping_tracking_url}" target="_blank" style="background-color:${colorLight}; color:#fff; padding:10px 20px; text-decoration:none; border-radius:4px; font-weight:bold; font-size:14px; display:inline-block;">
                  Suivre mon colis
                </a>
              </div>
              ` : ""}

              ${changes?.length ? `
                <h3 style="color:${colorDark}; font-size:16px; border-bottom:1px solid #eee; padding-bottom:8px; margin-bottom:12px;">Détails de la mise à jour</h3>
                <table style="width:100%; border-collapse:collapse; margin-bottom:25px; background-color:#fff; border:1px solid #eee;">
                  <thead>
                    <tr style="background-color:${colorBg};">
                      <th style="text-align:left; padding:10px; border-bottom:1px solid #ddd; color:#555; font-size:12px; text-transform:uppercase;">Champ</th>
                      <th style="text-align:left; padding:10px; border-bottom:1px solid #ddd; color:#555; font-size:12px; text-transform:uppercase;">Avant</th>
                      <th style="text-align:left; padding:10px; border-bottom:1px solid #ddd; color:${colorDark}; font-size:12px; text-transform:uppercase;">Après</th>
                    </tr>
                  </thead>
                  <tbody>${changeRows}</tbody>
                </table>
              ` : ""}

              ${address ? `
                <div style="border:1px solid #eee; border-radius:6px; padding:15px;">
                  <div style="color:${colorLight}; font-size:11px; text-transform:uppercase; font-weight:bold; margin-bottom:8px; letter-spacing:0.5px;">Adresse de livraison</div>
                  <div style="color:#333; font-size:14px; line-height:1.4;">
                    <strong>${address.full_name || "-"}</strong><br/>
                    ${address.address1 || ""}${address.address2 ? `, ${address.address2}` : ""}<br/>
                    ${address.postal_code || ""} ${address.city || ""} • ${address.country || ""}
                  </div>
                  <div style="margin-top:8px; font-size:13px; color:#777;">
                    ${address.email || ""} • ${address.phone || ""}
                  </div>
                </div>
              ` : ""}

            </div>

            <div style="background-color:#f9f9f9; padding:20px; text-align:center; border-top:1px solid #eee;">
              
              <div style="margin-bottom:15px; font-size:12px; color:#555; line-height:1.6;">
                <strong>NOVEDEN</strong><br/>
                <a href="https://www.noveden.com" style="color:#555; text-decoration:none;">www.noveden.com</a><br/>
                BE 1010.723.370 • Tél : +32 465 73 74 12
              </div>

              <p style="color:#999; font-size:11px; line-height:1.5; margin:0 0 15px 0;">
                Ceci est un e-mail automatique, merci de ne pas y répondre.<br/>
                Pour toute demande, écrivez-nous à <a href="mailto:contact@noveden.com" style="color:${colorDark}; text-decoration:none; font-weight:bold;">contact@noveden.com</a>
              </p>
              
              <p style="color:#aaa; font-size:10px; margin:10px 0 0 0; font-family:monospace; border-top:1px solid #ddd; padding-top:10px; display:inline-block;">
                Conçu avec ✨ par <b>GoulBAM Enterprises</b>
              </p>
            </div>

          </div>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}