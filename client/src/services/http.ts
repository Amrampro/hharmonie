// client/src/services/http.ts
type HttpOptions = RequestInit & { auth?: boolean };

export async function http<T>(url: string, options: HttpOptions = {}): Promise<T> {
  const auth = options.auth ?? true;

  // ⚠️ adapte la clé selon ton projet (ex: "auth_token", "token", etc.)
  const token = localStorage.getItem("token");

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    // si tu n’utilises PAS les cookies, tu peux enlever ceci
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.response = data;
    err.url = url;
    throw err;
  }

  return data as T;
}
