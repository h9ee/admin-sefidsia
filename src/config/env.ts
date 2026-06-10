export const env = {
  apiUrl: process.env.BASE_URL,
  /**
   * Base URL prefixed to every relative media path the backend returns
   * (e.g. `/uploads/2026/05/abc.webp`). When unset, falls back to the origin
   * of `apiUrl` — so uploads sitting on the same host as the API keep working.
   */
  imageUrl: process.env.BASE_IMAGE_URL ?? "",
  appName: "سفید و سیاه",
  storageKey: {
    accessToken: "ss-access-token",
    refreshToken: "ss-refresh-token",
    theme: "ss-theme",
    sidebar: "ss-sidebar",
  },
} as const;
