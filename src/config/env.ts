export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
  appName: "سفید و سیاه",
  storageKey: {
    accessToken: "ss-access-token",
    refreshToken: "ss-refresh-token",
    theme: "ss-theme",
    sidebar: "ss-sidebar",
  },
} as const;
