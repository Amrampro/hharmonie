import { http } from "./http";
import { apiEndpoints } from "./apiEndpoints";
export type Testimonial = { id: string; author_name: string; photo_url: string; testimony: string; product_id: string; product_name: string; product_slug: string; product_image: string | null; product_price: number; is_active: number | boolean; display_order: number };
export type Collaborator = { id: string; company_name: string; person_name: string | null; address: string | null; phone: string | null; country: string | null; is_active: number | boolean; display_order: number };
export type ContactMessage = { id: string; name: string; email: string; subject: string; message: string; is_read: number | boolean; created_at: string };
export const contentService = {
  list: <T,>(kind: string, admin = false) => http<{ items: T[] }>(`${apiEndpoints.base}/content/${admin ? "admin/" : ""}${kind}`, { auth: admin }),
  save: (kind: string, payload: object, id?: string) => http(`${apiEndpoints.base}/content/admin/${kind}${id ? `/${encodeURIComponent(id)}` : ""}`, { method: id ? "PUT" : "POST", body: JSON.stringify(payload) }),
  remove: (kind: string, id: string) => http(`${apiEndpoints.base}/content/admin/${kind}/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
