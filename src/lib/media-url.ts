import { env } from "@/config/env";

/**
 * The backend returns relative URLs like `/uploads/2026/05/abc.jpg`.
 * Prefix them with the configured image base so <img> / <video> can load them.
 *
 * Resolution order:
 *   1. Absolute URLs (`http(s)://`, `data:`, `blob:`) pass through.
 *   2. `NEXT_PUBLIC_API_URL_IMAGE` (`env.imageUrl`) — dedicated image host.
 *   3. Fallback to the origin of `apiUrl`.
 */
export function mediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  const base = imageBase();
  if (!base) return url;
  return base + (url.startsWith("/") ? url : `/${url}`);
}

function imageBase(): string {
  const explicit = env.imageUrl?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  try {
    return new URL(env.apiUrl).origin;
  } catch {
    return "";
  }
}
