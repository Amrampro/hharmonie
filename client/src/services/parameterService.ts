// client/src/services/parameterService.ts
import { apiEndpoints } from "./apiEndpoints";
// 👇 1. IMPORT DE LA FONCTION SÉCURISÉE
import { http } from "./http";

export type Parameters = {
  id: string;

  promotional_text: string | null;

  home_text: string | null;
  story: string | null;
  mission: string | null;
  vision: string | null;
  expertise: string | null;

  name: string | null;
  email: string | null;
  address: string | null;
  phone: string | null;
  enterprise_number: string | null;

  facebook_link: string | null;
  instagram_link: string | null;
  twitter_link: string | null;
  whatsapp_link: string | null;

  // ✅ new
  logo_navbar: string | null;
  logo_footer: string | null;

  created_at: string;
  updated_at: string;
};

export type UpsertParametersPayload = Partial<
  Pick<
    Parameters,
    | "promotional_text"
    | "home_text"
    | "story"
    | "mission"
    | "vision"
    | "expertise"
    | "name"
    | "email"
    | "address"
    | "phone"
    | "enterprise_number"
    | "facebook_link"
    | "instagram_link"
    | "twitter_link"
    | "whatsapp_link"
    | "logo_navbar"
    | "logo_footer"
  >
>;

// ❌ ANCIENNE FONCTION HTTP SUPPRIMÉE

// 👇 2. MISE À JOUR DE httpForm POUR INCLURE LE TOKEN
// (nécessaire si vous protégez l'upload, et bonne pratique générale)
async function httpForm<T>(url: string, formData: FormData): Promise<T> {
  const token = localStorage.getItem("token"); // Récupération du token

  const res = await fetch(url, {
    method: "POST",
    body: formData,
    headers: {
      // Pas de Content-Type ici, FormData s'en occupe
      // Injection du token
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

export const parameterService = {
  // Public (Le token est envoyé s'il existe, mais ignoré par le backend sur cette route)
  async get() {
    return http<{ parameters: Parameters | null }>(apiEndpoints.parameters.get);
  },

  // Admin (Maintenant sécurisé : le token est envoyé)
  async upsert(payload: UpsertParametersPayload) {
    return http<{ parameters: Parameters }>(apiEndpoints.parameters.upsert, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  // ✅ Upload d'image (Sécurisé via httpForm local)
  async uploadProductImage(file: File): Promise<{ url: string }> {
    const fd = new FormData();
    fd.append("file", file); 
    // Utilise la fonction locale mise à jour plus haut
    return httpForm<{ url: string }>(apiEndpoints.uploads.productImage, fd);
  },
};