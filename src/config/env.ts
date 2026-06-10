export const env = {
  apiUrl: process.env.BASE_URL,
  imageUrl: process.env.BASE_IMAGE_URL,
  appName: "سفید و سیاه",
  storageKey: {
    accessToken: "ss-access-token",
    refreshToken: "ss-refresh-token",
    theme: "ss-theme",
    sidebar: "ss-sidebar",
  },
} as const;
