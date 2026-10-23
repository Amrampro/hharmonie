export const orderLabels: Record<string, string> = {
  pending_payment: "En attente de paiement", pending: "Commande reçue", paid: "Paiement confirmé",
  processing: "En préparation", shipped: "Expédiée", in_transit: "En transit", delivered: "Livrée",
  completed: "Terminée", cancelled: "Annulée", canceled: "Annulée", refunded: "Remboursée",
  returned: "Retournée à l’expéditeur", not_set: "En attente de préparation", label_created: "Étiquette créée",
  requires_payment: "En attente de paiement", succeeded: "Paiement réussi", failed: "Échec du paiement",
  requires_action: "Action requise", requires_payment_method: "Moyen de paiement requis",
};
export const statusLabel = (status?: string | null) => orderLabels[status || ""] || "Statut non renseigné";
export const shippingLabel = (method?: string | null) => method === "mondial_relay" ? "Point relais — Mondial Relay" : method === "home_delivery" ? "Livraison à domicile" : "Non renseigné";
export function orderProgress(status: string, shipping?: string) {
  const exception = ["cancelled", "canceled", "refunded", "returned"].includes(status) ? status : shipping === "returned" ? "returned" : null;
  const stage = exception ? -1
    : ["delivered", "completed"].includes(status) || shipping === "delivered" ? 4
    : status === "shipped" || shipping === "in_transit" ? 3
    : status === "processing" || shipping === "label_created" ? 2
    : status === "paid" ? 1 : 0;
  return { stage, exception };
}
