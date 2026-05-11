export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  appName: "سفید و سیاه",
  storageKey: {
    accessToken: "ss-access-token",
    refreshToken: "ss-refresh-token",
    theme: "ss-theme",
    sidebar: "ss-sidebar",
  },
} as const;
