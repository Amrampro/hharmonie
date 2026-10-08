import { renderInvoiceEmail } from "./invoiceEmailTemplate.js";
const escape = value => String(value ?? "—").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export function notificationLabel(value) {
  return ({ pending_payment: "En attente de paiement", paid: "Payée", processing: "En préparation", shipped: "Expédiée", delivered: "Livrée", cancelled: "Annulée", refunded: "Remboursée", not_set: "Non défini", label_created: "Étiquette créée", in_transit: "En transit", returned: "Retournée", mondial_relay: "Mondial Relay", home_delivery: "Livraison à domicile" })[value] || value || "—";
}
export function renderAdminOrderNotificationEmail({ action, orderBefore, orderAfter, address, changes = [], company, orderUrl, siteUrl }) {
  const order = orderAfter || orderBefore;
  const heading = action === "deleted" ? "Commande supprimée" : "Mise à jour de votre commande";
  const extraHtml = `<div style="padding:16px;background:#f5efea;border-radius:8px;margin:20px 0"><h3>Informations mises à jour</h3>${changes.map(c => `<p><strong>${escape(c.label)}</strong><br>Avant : ${escape(notificationLabel(c.before))}<br>Après : <strong>${escape(notificationLabel(c.after))}</strong></p>`).join("")}<p>Statut de commande : <strong>${escape(notificationLabel(order.status))}</strong></p><p>Mode de livraison : ${escape(notificationLabel(order.shipping_method))}<br>Statut de livraison : ${escape(notificationLabel(order.shipping_status))}<br>Numéro de suivi : ${escape(order.shipping_tracking_number)}</p>${/^https?:\/\//i.test(order.shipping_tracking_url || "") ? `<p><a href="${escape(order.shipping_tracking_url)}">Suivre mon colis</a></p>` : ""}</div>`;
  return renderInvoiceEmail({ order, items: order.items || [], address, company, orderUrl, siteUrl, heading,
    intro: action === "deleted" ? "Votre commande a été supprimée. Contactez-nous pour toute question." : "Retrouvez les changements et le récapitulatif complet de votre commande ci-dessous.", extraHtml });
}
