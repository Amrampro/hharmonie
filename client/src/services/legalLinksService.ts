// client/src/services/legalLinksService.ts
import { apiEndpoints } from "./apiEndpoints";
// 👇 1. IMPORT DE LA FONCTION SÉCURISÉE
import { http } from "./http";

export type LegalLink = {
  id: string;
  name: string;
  file: string; // URL or path
  display_order: number;
  is_active: boolean | number;
  created_at: string;
  updated_at: string;
};

type ListLegalLinksParams = {
  active?: boolean;
};

type CreateLegalLinkPayload = {
  name: string;
  file: string;
  display_order?: number;
  is_active?: boolean;
};

type UpdateLegalLinkPayload = Partial<CreateLegalLinkPayload>;

// ❌ ANCIENNE FONCTION HTTP SUPPRIMÉE

// 👇 2. AJOUT DE httpForm POUR UPLOAD DE FICHIERS (PDFs, Docs)
async function httpForm<T>(url: string, formData: FormData): Promise<T> {
  const token = localStorage.getItem("token");

  const res = await fetch(url, {
    method: "POST",
    body: formData,
    headers: {
      // Pas de Content-Type (géré par FormData)
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

function qs(params: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

const toBool = (v: any) => v === true || v === 1 || v === "1";
const toNum = (v: any) => (v === null || v === undefined || v === "" ? 0 : Number(v));

function normalizeLegalLink(raw: any): LegalLink {
  return {
    ...raw,
    is_active: toBool(raw.is_active),
    display_order: toNum(raw.display_order),
  } as LegalLink;
}

export const legalLinksService = {
  // ---------- Public ----------
  async listLegalLinks(params: ListLegalLinksParams = {}) {
    const q = qs({
      active: params.active === undefined ? undefined : params.active ? "1" : "0",
    });
    // ✅ Utilise le http importé
    const data = await http<{ links: any[] }>(`${apiEndpoints.legalLinks.list}${q}`);
    return { links: (data.links || []).map(normalizeLegalLink) as LegalLink[] };
  },

  async getLegalLinkById(id: string) {
    const data = await http<{ link: any }>(apiEndpoints.legalLinks.byId(id));
    return { link: normalizeLegalLink(data.link) as LegalLink };
  },

  // ---------- Admin CRUD (Maintenant sécurisé) ----------
  async adminCreateLegalLink(payload: CreateLegalLinkPayload) {
    const data = await http<{ link: any }>(apiEndpoints.legalLinks.admin.create, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { link: normalizeLegalLink(data.link) as LegalLink };
  },

  async adminUpdateLegalLink(id: string, payload: UpdateLegalLinkPayload) {
    const data = await http<{ link: any }>(apiEndpoints.legalLinks.admin.update(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return { link: normalizeLegalLink(data.link) as LegalLink };
  },

  adminDeleteLegalLink(id: string) {
    return http<{ success: true }>(apiEndpoints.legalLinks.admin.delete(id), {
      method: "DELETE",
    });
  },

  // ---------- Upload (Pour uploader les PDF/Docs) ----------
  async uploadLegalFile(file: File): Promise<{ url: string }> {
    const fd = new FormData();
    fd.append("file", file); // le backend attend "file" via multer
    // Utilise l'endpoint d'upload générique (ou un spécifique si tu en as créé un)
    return httpForm<{ url: string }>(apiEndpoints.uploads.productImage, fd);
  },
};