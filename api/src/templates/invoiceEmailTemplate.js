// api/src/templates/invoiceEmailTemplate.js

// Fonction utilitaire pour formater les prix en EUR (format belge/français)
function money(cents, currency = "EUR") {
  const v = (Number(cents || 0) / 100);
  try {
    return new Intl.NumberFormat("fr-BE", { style: "currency", currency }).format(v);
  } catch {
    return `${v.toFixed(2)} ${currency}`;
  }
}

export function renderInvoiceEmail({ order, items, address }) {
  // Couleurs de la marque NOVEDEN
  const colorDark = "#113D23";  // Vert foncé
  const colorLight = "#A8B89F"; // Vert sauge
  const colorBg = "#F4F6F4";    // Fond gris très clair

  // ⚠️ IMPORTANT : Remplacez cette ligne par la vraie logique de votre backend
  // Exemple : const orderUrl = order.invoice_pdf_link || `https://api.noveden.com/invoices/${order.id}.pdf`;
  const orderUrl = `https://www.noveden.com/order-success?order=${order.id}`;

  // Génération des lignes du tableau (Articles)
  const rows = items
    .map(
      (it) => `
      <tr>
        <td style="padding:12px 8px; border-bottom:1px solid #eee; color:#333;">${it.product_name}</td>
        <td style="padding:12px 8px; border-bottom:1px solid #eee; text-align:right; white-space:nowrap;">${money(it.unit_price, order.currency)}</td>
        <td style="padding:12px 8px; border-bottom:1px solid #eee; text-align:right;">${it.quantity}</td>
        <td style="padding:12px 8px; border-bottom:1px solid #eee; text-align:right; font-weight:bold; color:${colorDark}; white-space:nowrap;">${money(it.line_total, order.currency)}</td>
      </tr>
    `
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Votre Facture NOVEDEN</title>
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
              
              <div style="text-align:center; margin-bottom:30px;">
                <h2 style="color:${colorDark}; margin:0 0 5px 0; font-size:20px;">Merci pour votre commande !</h2>
                <p style="color:#666; margin:0; font-size:14px;">Facture n° ${order.id}</p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:25px;">
                <tr>
                  <td valign="top" width="50%" style="padding-right:10px;">
                    <div style="font-size:12px; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Date</div>
                    <div style="color:#333; font-weight:500;">${new Date(order.created_at).toLocaleString("fr-BE")}</div>
                    
                    <div style="font-size:12px; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-top:12px; margin-bottom:4px;">Statut</div>
                    <div style="color:${colorDark}; font-weight:bold;">${order.status}</div>
                  </td>
                  <td valign="top" width="50%" style="padding-left:15px; border-left:2px solid ${colorLight};">
                    <div style="font-size:12px; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Client</div>
                    <div style="color:#333; line-height:1.4;">
                      <strong>${address?.full_name || "-"}</strong><br/>
                      ${address?.email || "-"}<br/>
                      ${address?.address1 || ""}<br/>
                      ${address?.postal_code || ""} ${address?.city || ""}
                    </div>
                  </td>
                </tr>
              </table>

              <table width="100%" style="border-collapse:collapse; margin-bottom:20px;">
                <thead>
                  <tr style="border-bottom:2px solid ${colorLight};">
                    <th style="text-align:left; padding:8px; color:${colorDark}; font-size:13px; text-transform:uppercase;">Article</th>
                    <th style="text-align:right; padding:8px; color:${colorDark}; font-size:13px; text-transform:uppercase;">Prix</th>
                    <th style="text-align:right; padding:8px; color:${colorDark}; font-size:13px; text-transform:uppercase;">Qté</th>
                    <th style="text-align:right; padding:8px; color:${colorDark}; font-size:13px; text-transform:uppercase;">Total</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>

              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:30px;">
                <tr>
                  <td align="right">
                    <table width="280" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:6px 0; color:#666;">Sous-total</td>
                        <td style="padding:6px 0; text-align:right; color:#333;">${money(order.subtotal_amount, order.currency)}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0; color:#666;">Réduction</td>
                        <td style="padding:6px 0; text-align:right; color:${colorLight};">- ${money(order.discount_amount, order.currency)}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0; color:#666;">Livraison</td>
                        <td style="padding:6px 0; text-align:right; color:#333;">${money(order.shipping_amount, order.currency)}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0 0; border-top:1px solid #eee; font-weight:bold; color:${colorDark}; font-size:16px;">Total</td>
                        <td style="padding:12px 0 0; border-top:1px solid #eee; font-weight:bold; text-align:right; color:${colorDark}; font-size:16px;">${money(order.total_amount, order.currency)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <div style="text-align:center; margin: 40px 0 10px 0;">
                <a href="${orderUrl}" target="_blank" style="background-color:${colorDark}; color:#ffffff; padding:12px 25px; border-radius:50px; text-decoration:none; font-weight:bold; font-size:14px; display:inline-block;">
                  Voir sur le site
                </a>
              </div>

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