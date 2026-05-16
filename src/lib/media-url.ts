import { env } from "@/config/env";

/**
 * The backend returns relative URLs like `/uploads/2026/05/abc.jpg`.
 * Prefix them with the API origin so <img> / <video> can load them.
 * Absolute URLs (`http://...`, `https://...`, `data:`, `blob:`) pass through.
 */
export function mediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  try {
    const origin = new URL(env.apiUrl).origin;
    return origin + (url.startsWith("/") ? url : `/${url}`);
  } catch {
    return url;
  }
}
