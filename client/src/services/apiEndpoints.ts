// client/src/services/apiEndpoints.ts
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/+$/, "") ||
  (import.meta.env.PROD ? "/api" : "http://localhost:3001/api");

export const apiEndpoints = {
  base: API_BASE_URL,

  auth: {
    base: `${API_BASE_URL}/auth`,
    signup: `${API_BASE_URL}/auth/signup`,
    signin: `${API_BASE_URL}/auth/signin`,
    me: `${API_BASE_URL}/auth/me`,
    profile: `${API_BASE_URL}/auth/profile`, // GET/PUT
  password: `${API_BASE_URL}/auth/password`, // ✅ PUT
  },

  products: {
    base: `${API_BASE_URL}/products`,
    list: `${API_BASE_URL}/products`,
    bySlug: (slug: string) => `${API_BASE_URL}/products/slug/${encodeURIComponent(slug)}`,

    admin: {
      create: `${API_BASE_URL}/products/admin`,
      byId: (id: string) => `${API_BASE_URL}/products/admin/${encodeURIComponent(id)}`,
      update: (id: string) => `${API_BASE_URL}/products/admin/${encodeURIComponent(id)}`,
      delete: (id: string) => `${API_BASE_URL}/products/admin/${encodeURIComponent(id)}`,
    },
  },

  // ✅ ---------------- Uploads (NEW) ----------------
  uploads: {
    // POST multipart/form-data with field name: "file"
    // returns: { url: "https://your-domain/uploads/products/xxxx.jpg" }
    productImage: `${API_BASE_URL}/uploads/product-image`,
  },

  productCategories: {
    base: `${API_BASE_URL}/admin/product-categories`,
    list: `${API_BASE_URL}/admin/product-categories`,
    create: `${API_BASE_URL}/admin/product-categories`,
    update: (id: string) =>
      `${API_BASE_URL}/admin/product-categories/${encodeURIComponent(id)}`,
    delete: (id: string) =>
      `${API_BASE_URL}/admin/product-categories/${encodeURIComponent(id)}`,
  },

  blog: {
    base: `${API_BASE_URL}/blog`,
    list: `${API_BASE_URL}/blog`,
    bySlug: (slug: string) => `${API_BASE_URL}/blog/slug/${encodeURIComponent(slug)}`,

    admin: {
      list: `${API_BASE_URL}/blog/admin`,
      create: `${API_BASE_URL}/blog/admin`,
      byId: (id: string) => `${API_BASE_URL}/blog/admin/${encodeURIComponent(id)}`,
      update: (id: string) => `${API_BASE_URL}/blog/admin/${encodeURIComponent(id)}`,
      delete: (id: string) => `${API_BASE_URL}/blog/admin/${encodeURIComponent(id)}`,
      publish: (id: string) =>
        `${API_BASE_URL}/blog/admin/${encodeURIComponent(id)}/publish`,
      unpublish: (id: string) =>
        `${API_BASE_URL}/blog/admin/${encodeURIComponent(id)}/unpublish`,
    },
  },

  blogCategories: {
    base: `${API_BASE_URL}/admin/blog-categories`,
    list: `${API_BASE_URL}/admin/blog-categories`,
    create: `${API_BASE_URL}/admin/blog-categories`,
    update: (id: string) =>
      `${API_BASE_URL}/admin/blog-categories/${encodeURIComponent(id)}`,
    delete: (id: string) =>
      `${API_BASE_URL}/admin/blog-categories/${encodeURIComponent(id)}`,
  },

  events: {
    list: `${API_BASE_URL}/events`,
    bySlug: (slug: string) => `${API_BASE_URL}/events/slug/${encodeURIComponent(slug)}`,
    admin: {
      list: `${API_BASE_URL}/events/admin`,
      create: `${API_BASE_URL}/events/admin`,
      update: (id: string) => `${API_BASE_URL}/events/admin/${encodeURIComponent(id)}`,
      delete: (id: string) => `${API_BASE_URL}/events/admin/${encodeURIComponent(id)}`,
    },
  },

  appointments: {
    services: `${API_BASE_URL}/appointments/services`,
    slots: `${API_BASE_URL}/appointments/slots`,
    book: `${API_BASE_URL}/appointments/book`,
    admin: {
      list: `${API_BASE_URL}/appointments/admin`,
      services: `${API_BASE_URL}/appointments/admin/services`,
      slots: `${API_BASE_URL}/appointments/admin/slots`,
      slot: (id: string) => `${API_BASE_URL}/appointments/admin/slots/${encodeURIComponent(id)}`,
    },
  },

  coupons: {
    base: `${API_BASE_URL}/coupons`,
  },

  theme: {
    base: `${API_BASE_URL}/theme`,
  },

  admin: {
    base: `${API_BASE_URL}/admin`,
  },
  faqs: {
    list: `${API_BASE_URL}/faqs`,
    byId: (id: string) => `${API_BASE_URL}/faqs/${id}`,

    admin: {
      create: `${API_BASE_URL}/faqs/admin`,
      update: (id: string) => `${API_BASE_URL}/faqs/admin/${id}`,
      delete: (id: string) => `${API_BASE_URL}/faqs/admin/${id}`,
    },
  },
  banners: {
    list: `${API_BASE_URL}/banners`,
    byId: (id: string) => `${API_BASE_URL}/banners/${id}`,
    // inside apiEndpoints.banners
    activeByPage: (pageName: string) => `${API_BASE_URL}/banners/active/${encodeURIComponent(pageName)}`,

    admin: {
      create: `${API_BASE_URL}/banners`,
      update: (id: string) => `${API_BASE_URL}/banners/${id}`,
      delete: (id: string) => `${API_BASE_URL}/banners/${id}`,
    },
  },

  legalLinks: {
    list: `${API_BASE_URL}/legal-links`,
    byId: (id: string) => `${API_BASE_URL}/legal-links/${id}`,
    admin: {
      create: `${API_BASE_URL}/legal-links`,
      update: (id: string) => `${API_BASE_URL}/legal-links/${id}`,
      delete: (id: string) => `${API_BASE_URL}/legal-links/${id}`,
    },
  },
  parameters: {
    get: `${API_BASE_URL}/parameters`,
    upsert: `${API_BASE_URL}/parameters`, // PUT
  },
  // inside apiEndpoints export
  productReviews: {
    listByProductId: (productId: string) => `${API_BASE_URL}/pr/products/${productId}/reviews`,
    createForProductId: (productId: string) => `${API_BASE_URL}/pr/products/${productId}/reviews`,
    admin: {
      list: `${API_BASE_URL}/pr/admin/product-reviews`,
      delete: (id: string) => `${API_BASE_URL}/pr/admin/product-reviews/${id}`,
    },
  },
  orders: {
    checkout: `${API_BASE_URL}/orders/checkout`,
    byId: (id: string) => `${API_BASE_URL}/orders/${id}`,
  },
  adminOrders: {
    list: `${API_BASE_URL}/admin/orders`,
    byId: (id: string) => `${API_BASE_URL}/admin/orders/${id}`,
    status: (id: string) => `${API_BASE_URL}/admin/orders/${id}/status`,
    setShipping: (id: string) => `${API_BASE_URL}/admin/orders/${id}/shipping`,
    delete: (id: string) => `${API_BASE_URL}/admin/orders/${id}`,
  },
  adminFinance: {
    list: `${API_BASE_URL}/admin/finance`,
  },
  newsletter: {
    subscribe: `${API_BASE_URL}/admin/newsletter-subscribers`,
    adminList: `${API_BASE_URL}/admin/newsletter-subscribers`,
    adminDelete: (id: number) => `${API_BASE_URL}/admin/newsletter-subscribers/${id}`,
  },
  contact: {
    send: `${API_BASE_URL}/contact`,
  },
  mondialRelay: {
  parcelshops: `${API_BASE_URL}/mondial-relay/parcelshops`,
},

  // ✅ =====================================================
  // ✅ AMBASSADORS (NEW)
  // ✅ =====================================================

  ambassadors: {
    me: `${API_BASE_URL}/ambassadors/me`,                 // GET
    register: `${API_BASE_URL}/ambassadors/me/register`,  // POST
    bank: `${API_BASE_URL}/ambassadors/me/bank`,          // PUT
    orders: `${API_BASE_URL}/ambassadors/me/orders`,      // GET
    payouts: `${API_BASE_URL}/ambassadors/me/payouts`,    // GET
  },

  adminAmbassadors: {
    list: `${API_BASE_URL}/admin/ambassadors`,
    byId: (id: string) =>
      `${API_BASE_URL}/admin/ambassadors/${encodeURIComponent(id)}`,
    orders: (id: string) =>
      `${API_BASE_URL}/admin/ambassadors/${encodeURIComponent(id)}/orders`,
    payouts: (id: string) =>
      `${API_BASE_URL}/admin/ambassadors/${encodeURIComponent(id)}/payouts`,
    pay: (id: string) =>
      `${API_BASE_URL}/admin/ambassadors/${encodeURIComponent(id)}/pay`,
  },


} as const;

export type ApiEndpoints = typeof apiEndpoints;
