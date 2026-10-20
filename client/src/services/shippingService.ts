import { http } from "./http";
import { apiEndpoints } from "./apiEndpoints";
export type ShippingMethod = {
  method: "mondial_relay" | "home_delivery";
  free_shipping_threshold_cents: number | null;
  rates: { country_code: string; country_name: string; amount_cents: number }[];
};
export const shippingService = {
  get: () => http<ShippingMethod[]>(`${apiEndpoints.base}/shipping`, { auth: false }),
  save: (methods: ShippingMethod[]) => http(`${apiEndpoints.base}/shipping`, { method: "PUT", body: JSON.stringify(methods) }),
};
