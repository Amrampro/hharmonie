// client/src/services/adminOrderService.ts
import { apiEndpoints } from "../apiEndpoints";
// 👇 AJOUT : On importe la fonction http qui gère le token (supposée être dans le même dossier)
import { http } from "../http"; 

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type ShippingMethod = "mondial_relay" | "home_delivery";

export type ShippingStatus =
  | "not_set"
  | "label_created"
  | "in_transit"
  | "delivered"
  | "returned";

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;

  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;

  created_at: string;
};

export type OrderAddress = {
  id: string;
  order_id: string;

  full_name: string;
  email: string;
  phone: string;

  country: string;
  city: string;
  postal_code: string;
  address1: string;
  address2: string | null;

  created_at: string;
  updated_at: string;
};

export type OrderPayment = {
  id: string;
  order_id: string;

  provider: "stripe";
  status: "requires_payment" | "processing" | "succeeded" | "failed" | "refunded";

  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;

  amount: number;
  currency: string;

  created_at: string;
  updated_at: string;
};

export type AdminOrder = {
  id: string;
  user_id: number;

  status: OrderStatus;

  currency: string;
  subtotal_amount: number;
  discount_amount: number;
  shipping_amount: number;
  total_amount: number;

  coupon_code: string | null;

  shipping_method: ShippingMethod | null;
  shipping_status: ShippingStatus;

  shipping_tracking_number: string | null;
  shipping_tracking_url: string | null;

  created_at: string;
  updated_at: string;

  user_email?: string | null;
  user_first_name?: string | null;
  user_last_name?: string | null;

  // present in list (backend adds items)
  items?: OrderItem[];

  customer_full_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;

  payment_status?: string | null;
  payment_provider?: string | null;

  // present in getById (backend adds address + payment)
  address?: OrderAddress | null;
  payment?: OrderPayment | null;
};

type ListOrdersParams = {
  status?: OrderStatus;
  shipping_status?: ShippingStatus;
  shipping_method?: ShippingMethod;
  q?: string;
  user_id?: number;
  limit?: number;
  offset?: number;
};

type ListOrdersResponse = {
  orders: AdminOrder[];
  total: number;
  limit?: number;
  offset?: number;
};

type UpdateOrderStatusPayload = {
  status: OrderStatus;
};

type UpdateShippingPayload = Partial<{
  shipping_method: ShippingMethod | null;
  shipping_status: ShippingStatus;
  shipping_tracking_number: string | null;
  shipping_tracking_url: string | null;
}>;

// ❌ SUPPRESSION : On a supprimé la fonction async function http<T> locale
// car elle ne gérait pas le token. On utilise l'import en haut du fichier.

function qs(params: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const adminOrderService = {
  // ---------- Admin ----------
  listOrders(params: ListOrdersParams = {}) {
    // Note: http inclut auth: true par défaut grâce à ton fichier http.ts
    return http<ListOrdersResponse>(`${apiEndpoints.adminOrders.list}${qs(params)}`);
  },

  getOrderById(id: string) {
    return http<{ order: AdminOrder }>(apiEndpoints.adminOrders.byId(id));
  },

  updateOrderStatus(id: string, payload: UpdateOrderStatusPayload) {
    return http<{ order: AdminOrder }>(apiEndpoints.adminOrders.status(id), {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  updateOrderShipping(id: string, payload: UpdateShippingPayload) {
    return http<{ order: AdminOrder }>(apiEndpoints.adminOrders.setShipping(id), {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  deleteOrder(id: string) {
    return http<{ message?: string; success?: true }>(apiEndpoints.adminOrders.delete(id), {
      method: "DELETE",
    });
  },
};