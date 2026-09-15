import { apiEndpoints } from "./apiEndpoints";
import { http } from "./http";

export type EventItem = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  cover_image_url: string | null;
  event_type: "online" | "physical" | "hybrid";
  location_name: string | null;
  city: string | null;
  online_url: string | null;
  starts_at: string;
  ends_at: string | null;
  capacity: number | null;
  price: number;
  currency: string;
  status: "draft" | "published" | "cancelled" | "completed";
  created_at: string;
};

function qs(params: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    sp.set(key, String(value));
  });
  const value = sp.toString();
  return value ? `?${value}` : "";
}

export const eventService = {
  list(params: { limit?: number; admin?: boolean } = {}) {
    const endpoint = params.admin ? apiEndpoints.events.admin.list : apiEndpoints.events.list;
    return http<{ events: EventItem[] }>(`${endpoint}${qs({ limit: params.limit })}`, { auth: params.admin ?? false });
  },

  bySlug(slug: string) {
    return http<{ event: EventItem }>(apiEndpoints.events.bySlug(slug), { auth: false });
  },

  adminCreate(payload: Partial<EventItem>) {
    return http<{ event: EventItem }>(apiEndpoints.events.admin.create, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  adminUpdate(id: string, payload: Partial<EventItem>) {
    return http<{ event: EventItem }>(apiEndpoints.events.admin.update(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  adminDelete(id: string) {
    return http<{ success: true }>(apiEndpoints.events.admin.delete(id), {
      method: "DELETE",
    });
  },
};

