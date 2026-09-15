// client/src/services/bannerService.ts
import { apiEndpoints } from "./apiEndpoints";
// 👇 1. On importe le http sécurisé
import { http } from "./http"; 

export type BannerPageName = "shop" | "home" | "about" | "faqs" | "contact" | "approach" | "consultation" | "events";

export type Banner = {
  id: string;
  page_name: BannerPageName;
  title: string | null;
  subtitle: string | null;
  button: string | null;
  link: string | null;
  background_img: string | null;
  is_active: boolean | number; // MySQL tinyint can come as 0/1
  display_order: number;
  created_at: string;
  updated_at: string;
};

type ListBannersParams = {
  page_name?: BannerPageName;
  active?: boolean;
};

type CreateBannerPayload = {
  page_name: BannerPageName;
  title?: string | null;
  subtitle?: string | null;
  button?: string | null;
  link?: string | null;
  background_img?: string | null;
  is_active?: boolean;
  display_order?: number;
};

type UpdateBannerPayload = Partial<CreateBannerPayload>;

// 👇 2. Fonction spécifique pour l'upload (FormData) AVEC Auth
// On ne peut pas utiliser le 'http' importé car il force le JSON via 'Content-Type'
async function httpForm<T>(url: string, formData: FormData): Promise<T> {
  const token = localStorage.getItem("token"); // Récupère le token

  const res = await fetch(url, {
    method: "POST",
    body: formData,
    headers: {
      // ⚠️ NE PAS mettre Content-Type (le navigateur le mettra automatiquement avec le boundary)
      // ✅ AJOUT du token pour passer le middleware admin
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

// ❌ ANCIENNE FONCTION HTTP LOCALE SUPPRIMÉE

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

function normalizeBanner(raw: any): Banner {
  return {
    ...raw,
    is_active: toBool(raw.is_active),
    display_order: toNum(raw.display_order),
  } as Banner;
}

export const bannerService = {
  // ✅ Public: active banner by page
  async getActiveBannerByPageName(pageName: BannerPageName) {
    return http<{ banner: any | null }>(apiEndpoints.banners.activeByPage(pageName));
  },

  // ---------- Public ----------
  async listBanners(params: ListBannersParams = {}) {
    const q = qs({
      page_name: params.page_name,
      active: params.active === undefined ? undefined : params.active ? "1" : "0",
    });
    return http<{ banners: any[] }>(`${apiEndpoints.banners.list}${q}`).then((data) => ({
      banners: (data.banners || []).map(normalizeBanner) as Banner[],
    }));
  },

  async getBannerById(id: string) {
    return http<{ banner: any }>(apiEndpoints.banners.byId(id)).then((data) => ({
      banner: normalizeBanner(data.banner) as Banner,
    }));
  },

  // ---------- Admin CRUD (Sécurisé grâce à l'import http) ----------
  async adminCreateBanner(payload: CreateBannerPayload) {
    return http<{ banner: any }>(apiEndpoints.banners.admin.create, {
      method: "POST",
      body: JSON.stringify(payload),
    }).then((data) => ({ banner: normalizeBanner(data.banner) as Banner }));
  },

  async adminUpdateBanner(id: string, payload: UpdateBannerPayload) {
    return http<{ banner: any }>(apiEndpoints.banners.admin.update(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    }).then((data) => ({ banner: normalizeBanner(data.banner) as Banner }));
  },

  adminDeleteBanner(id: string) {
    return http<{ success: true }>(apiEndpoints.banners.admin.delete(id), {
      method: "DELETE",
    });
  },

  // ---------- Uploads (Sécurisé grâce à httpForm local) ----------
  async uploadBannerImage(file: File): Promise<{ url: string }> {
    const fd = new FormData();
    fd.append("file", file); 
    // Utilise le httpForm défini plus haut qui inclut le Token
    return httpForm<{ url: string }>(apiEndpoints.uploads.productImage, fd);
  },
};
