import { URL } from "node:url";
export function publicSiteUrl() {
  const configured = process.env.PUBLIC_SITE_URL || (process.env.CORS_ORIGIN || "").split(",")[0].trim();
  const fallback = process.env.NODE_ENV === "production" ? "https://hharmonie.com" : "http://localhost:5173";
  const url = new URL(configured || fallback);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("PUBLIC_SITE_URL invalide");
  if (process.env.NODE_ENV === "production" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return "https://hharmonie.com";
  return url.origin;
}
export function orderTrackingUrl(order) {
  return `${publicSiteUrl()}/follow-order?order=${encodeURIComponent(order.id)}&token=${encodeURIComponent(order.tracking_token)}`;
}
