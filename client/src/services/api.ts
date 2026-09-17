// client/src/services/api.ts
import { apiEndpoints } from "./apiEndpoints";
const API_URL = apiEndpoints.base;
const TOKEN_KEY = "token"; // ✅ clé unique partout

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = this.safeGetToken();
  }

  // -----------------------
  // Token helpers
  // -----------------------
  private safeGetToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      // Navigateur/Tracking prevention (Edge/Safari) peut bloquer
      return null;
    }
  }

  private safeSetToken(token: string) {
    this.token = token;
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      // fallback: garder au moins en mémoire (this.token) sans crash
      console.warn("[ApiService] Unable to persist token in localStorage:", error);
    }
  }

  private safeClearToken() {
    this.token = null;
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  }

  setToken(token: string) {
    this.safeSetToken(token);
  }

  clearToken() {
    this.safeClearToken();
  }

  // -----------------------
  // HTTP core
  // -----------------------
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

    // ✅ attach JWT
    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include", // tu l'avais dans d'autres services, utile si cookies/sessions
    });

    // parfois, certaines routes renvoient 204 No Content
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json().catch(() => null) : null;

    if (!res.ok) {
      const msg =
        (data && (data.error || data.message)) ||
        `HTTP ${res.status} ${res.statusText}`;
      throw new Error(msg);
    }

    return (data ?? ({} as any)) as T;
  }

  // -----------------------
  // Auth
  // -----------------------
  async signup(email: string, password: string, firstName: string, lastName: string, phone: string) {
    const data = await this.request<{ token?: string; user?: any }>(`/auth/signup`, {
      method: "POST",
      body: JSON.stringify({ email, password, firstName, lastName, phone }),
    });

    if (data?.token) this.setToken(data.token);

    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request<{ token?: string; user?: any }>(`/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    // ✅ C’EST ICI QUE LE TOKEN EST STOCKÉ (donc pas ailleurs)
    if (data?.token) this.setToken(data.token);

    return data;
  }

  async logout() {
    // si tu as un endpoint backend /auth/logout tu peux l'appeler ici
    this.clearToken();
    return { success: true };
  }

  async getProfile() {
    return await this.request(`/auth/profile`);
  }

  async updateProfile(updates: { firstName?: string; lastName?: string; phone?: string }) {
    return await this.request(`/auth/profile`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async updatePassword(payload: { currentPassword: string; newPassword: string }) {
    return await this.request(`/auth/password`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  // -----------------------
  // Products
  // -----------------------
  async getProducts(params?: { category?: string; featured?: boolean; search?: string }) {
    const qs = params ? new URLSearchParams(params as any).toString() : "";
    return await this.request(`/products${qs ? `?${qs}` : ""}`);
  }

  async getProductBySlug(slug: string) {
    return await this.request(`/products/${encodeURIComponent(slug)}`);
  }

  async getCategories() {
    return await this.request(`/products/categories`);
  }

  // -----------------------
  // Coupons
  // -----------------------
  async validateCoupon(code: string, cartTotal: number) {
    return await this.request(`/coupons/validate`, {
      method: "POST",
      body: JSON.stringify({ code, cartTotal }),
    });
  }

  // -----------------------
  // Blog
  // -----------------------
  async getBlogPosts(params?: { category?: string; limit?: number; offset?: number }) {
    const qs = params ? new URLSearchParams(params as any).toString() : "";
    return await this.request(`/blog${qs ? `?${qs}` : ""}`);
  }

  async getBlogPostBySlug(slug: string) {
    return await this.request(`/blog/${encodeURIComponent(slug)}`);
  }

  // -----------------------
  // FAQ
  // -----------------------
  async getFAQs(params?: { category?: string }) {
    const qs = params ? new URLSearchParams(params as any).toString() : "";
    return await this.request(`/faq${qs ? `?${qs}` : ""}`);
  }

  // -----------------------
  // Admin - Users
  // -----------------------
  async adminGetUsers(params?: { search?: string; limit?: number; offset?: number }) {
    const qs = params ? new URLSearchParams(params as any).toString() : "";
    return await this.request(`/admin/users${qs ? `?${qs}` : ""}`);
  }

  // -----------------------
  // Admin - Products
  // -----------------------
  async adminGetProducts(params?: { search?: string; category?: string }) {
    const qs = params ? new URLSearchParams(params as any).toString() : "";
    return await this.request(`/admin/products${qs ? `?${qs}` : ""}`);
  }

  async adminCreateProduct(product: any) {
    return await this.request(`/admin/products`, {
      method: "POST",
      body: JSON.stringify(product),
    });
  }

  async adminUpdateProduct(id: string, product: any) {
    return await this.request(`/admin/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    });
  }

  async adminDeleteProduct(id: string) {
    return await this.request(`/admin/products/${id}`, {
      method: "DELETE",
    });
  }

  // -----------------------
  // Admin - Coupons
  // -----------------------
  async adminGetCoupons() {
    return await this.request(`/admin/coupons`);
  }

  async adminCreateCoupon(coupon: any) {
    return await this.request(`/admin/coupons`, {
      method: "POST",
      body: JSON.stringify(coupon),
    });
  }

  async adminUpdateCoupon(id: string, coupon: any) {
    return await this.request(`/admin/coupons/${id}`, {
      method: "PUT",
      body: JSON.stringify(coupon),
    });
  }

  async adminDeleteCoupon(id: string) {
    return await this.request(`/admin/coupons/${id}`, {
      method: "DELETE",
    });
  }

  // -----------------------
  // Admin - Orders
  // -----------------------
  async adminGetOrders(params?: { status?: string }) {
    const qs = params ? new URLSearchParams(params as any).toString() : "";
    return await this.request(`/admin/orders${qs ? `?${qs}` : ""}`);
  }

  async adminUpdateOrderStatus(id: string, status: string) {
    return await this.request(`/admin/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  // -----------------------
  // Admin - Blog
  // -----------------------
  async adminGetBlogPosts() {
    return await this.request(`/admin/blog`);
  }

  async adminCreateBlogPost(post: any) {
    return await this.request(`/admin/blog`, {
      method: "POST",
      body: JSON.stringify(post),
    });
  }

  async adminUpdateBlogPost(id: string, post: any) {
    return await this.request(`/admin/blog/${id}`, {
      method: "PUT",
      body: JSON.stringify(post),
    });
  }

  async adminDeleteBlogPost(id: string) {
    return await this.request(`/admin/blog/${id}`, {
      method: "DELETE",
    });
  }

  // -----------------------
  // Admin - FAQ
  // -----------------------
  async adminGetFAQs() {
    return await this.request(`/admin/faq`);
  }

  async adminCreateFAQ(faq: any) {
    return await this.request(`/admin/faq`, {
      method: "POST",
      body: JSON.stringify(faq),
    });
  }

  async adminUpdateFAQ(id: string, faq: any) {
    return await this.request(`/admin/faq/${id}`, {
      method: "PUT",
      body: JSON.stringify(faq),
    });
  }

  async adminDeleteFAQ(id: string) {
    return await this.request(`/admin/faq/${id}`, {
      method: "DELETE",
    });
  }

  // -----------------------
  // Theme
  // -----------------------
  theme = {
    getAll: async () => {
      return await this.request(`/theme`);
    },

    update: async (key: string, value: string) => {
      return await this.request(`/theme/${encodeURIComponent(key)}`, {
        method: "PUT",
        body: JSON.stringify({ value }),
      });
    },

    updateMultiple: async (settings: Array<{ key: string; value: string }>) => {
      return await this.request(`/theme`, {
        method: "PUT",
        body: JSON.stringify({ settings }),
      });
    },
  };
}

export const api = new ApiService();
