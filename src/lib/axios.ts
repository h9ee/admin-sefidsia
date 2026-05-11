import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { env } from "@/config/env";
import { storage } from "./storage";

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const api: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  withCredentials: false,
  timeout: 20_000,
  headers: { "Accept-Language": "fa-IR" },
});

api.interceptors.request.use((config) => {
  const token = storage.get(env.storageKey.accessToken);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = storage.get(env.storageKey.refreshToken);
  if (!refreshToken) return null;
  try {
    const res = await axios.post<{ accessToken: string; refreshToken: string }>(
      `${env.apiUrl}/auth/refresh`,
      { refreshToken },
    );
    storage.set(env.storageKey.accessToken, res.data.accessToken);
    storage.set(env.storageKey.refreshToken, res.data.refreshToken);
    return res.data.accessToken;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    if (!original) throw error;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      refreshing ||= refreshAccessToken().finally(() => {
        refreshing = null;
      });
      const token = await refreshing;
      if (token) {
        original.headers ??= {} as never;
        (original.headers as Record<string, string>).Authorization = `Bearer ${token}`;
        return api(original);
      }
      // Force logout
      storage.remove(env.storageKey.accessToken);
      storage.remove(env.storageKey.refreshToken);
      if (typeof window !== "undefined") {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.replace(`/login?next=${next}`);
      }
    }
    throw error;
  },
);
