// client/src/services/newsletterService.ts
import { apiEndpoints } from "./apiEndpoints";
// 👇 1. IMPORT DE LA FONCTION SÉCURISÉE
import { http } from "./http";

export type NewsletterSubscriber = {
  id: number;
  email: string;
  created_at: string;
};

// ❌ ANCIENNE FONCTION jsonFetch SUPPRIMÉE

export const newsletterService = {
  // Public (Le http wrapper fonctionne aussi, le token est optionnel pour cette route)
  subscribe(email: string) {
    return http<{ status: "subscribed" | "already_subscribed"; message?: string }>(
      apiEndpoints.newsletter.subscribe,
      { method: "POST", body: JSON.stringify({ email }) }
    );
  },

  // Admin (Maintenant sécurisé : le token sera injecté automatiquement)
  adminList(params?: { limit?: number; offset?: number }) {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    
    // Assurez-vous que l'URL est bien construite avec les params
    const queryString = qs.toString() ? `?${qs.toString()}` : "";
    const url = `${apiEndpoints.newsletter.adminList}${queryString}`;

    return http<{ items: NewsletterSubscriber[]; total: number }>(url);
  },

  adminDelete(id: number) {
    return http<{ ok: boolean; affected: number }>(
      apiEndpoints.newsletter.adminDelete(id),
      { method: "DELETE" }
    );
  },
};