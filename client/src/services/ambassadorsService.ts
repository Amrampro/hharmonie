// client/src/services/ambassadorsService.ts
import { http } from "./http";
import { apiEndpoints } from "./apiEndpoints";

export type AdminPayPayload = { amount: number; note?: string };

export const ambassadorsService = {
  // ambassador (auth required)
  getMe() {
    return http<any>(apiEndpoints.ambassadors.me, { method: "GET", auth: true });
  },

  // ✅ NEW: create ambassador account
  register(payload?: { iban?: string; bank_account_name?: string }) {
    return http<any>(apiEndpoints.ambassadors.register, {
      method: "POST",
      body: JSON.stringify(payload || {}),
      auth: true,
    });
  },

  // ✅ NEW: update bank info
  updateBank(payload: { iban?: string | null; bank_account_name?: string | null }) {
    return http<any>(apiEndpoints.ambassadors.bank, {
      method: "PUT",
      body: JSON.stringify(payload),
      auth: true,
    });
  },

  getMyOrders() {
    return http<any>(apiEndpoints.ambassadors.orders, {
      method: "GET",
      auth: true,
    });
  },

  getMyPayouts() {
    return http<any>(apiEndpoints.ambassadors.payouts, {
      method: "GET",
      auth: true,
    });
  },

  // admin (auth required) — inchangé
  adminList(params?: { search?: string; limit?: number; offset?: number }) {
    const qs = params ? `?${new URLSearchParams(params as any).toString()}` : "";
    return http<any>(`${apiEndpoints.adminAmbassadors.list}${qs}`, {
      method: "GET",
      auth: true,
    });
  },

  adminGet(id: string) {
    return http<any>(apiEndpoints.adminAmbassadors.byId(id), {
      method: "GET",
      auth: true,
    });
  },

  adminOrders(id: string) {
    return http<any>(apiEndpoints.adminAmbassadors.orders(id), {
      method: "GET",
      auth: true,
    });
  },

  adminPayouts(id: string) {
    return http<any>(apiEndpoints.adminAmbassadors.payouts(id), {
      method: "GET",
      auth: true,
    });
  },

  adminPay(id: string, payload: AdminPayPayload) {
    return http<any>(apiEndpoints.adminAmbassadors.pay(id), {
      method: "POST",
      body: JSON.stringify(payload),
      auth: true,
    });
  },
};