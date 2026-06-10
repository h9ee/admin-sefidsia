/**
 * Public client env. Only `NEXT_PUBLIC_*` vars get inlined into the browser
 * bundle; anything without that prefix would silently be `undefined` here.
 * Empty-string defaults keep the types as `string` so consumers (e.g. the
 * `new URL(apiUrl)` call in media-url) don't need to handle `undefined`.
 */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
  imageUrl: process.env.NEXT_PUBLIC_API_URL_IMAGE ?? "",
  appName: "سفید و سیاه",
  storageKey: {
    accessToken: "ss-access-token",
    refreshToken: "ss-refresh-token",
    theme: "ss-theme",
    sidebar: "ss-sidebar",
  },
} as const;
