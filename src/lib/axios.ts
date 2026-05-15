import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { env } from "@/config/env";
import { storage } from "./storage";
import type {
  ApiEnvelope,
  ApiFailureEnvelope,
  Paginated,
  PaginationMeta,
} from "@/types";

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
    const res = await axios.post<ApiEnvelope<{ accessToken: string; refreshToken: string }>>(
      `${env.apiUrl}/auth/refresh`,
      { refreshToken },
    );
    const tokens = res.data?.data;
    if (!tokens?.accessToken) return null;
    storage.set(env.storageKey.accessToken, tokens.accessToken);
    storage.set(env.storageKey.refreshToken, tokens.refreshToken);
    return tokens.accessToken;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError<ApiFailureEnvelope>) => {
    const original = error.config as RetryConfig | undefined;
    if (!original) throw error;

    if (error.response?.status === 401 && !original._retry && !original.url?.includes("/auth/")) {
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
      storage.remove(env.storageKey.accessToken);
      storage.remove(env.storageKey.refreshToken);
      if (typeof window !== "undefined") {
        document.cookie = "ss-auth-presence=; Path=/; Max-Age=0";
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        if (!window.location.pathname.startsWith("/login")) {
          window.location.replace(`/login?next=${next}`);
        }
      }
    }
    throw error;
  },
);

/**
 * Unwrap the backend's `{ success, data, meta? }` envelope into `data`.
 */
function unwrap<T>(res: AxiosResponse<ApiEnvelope<T>>): T {
  return res.data?.data as T;
}

function unwrapPaginated<T>(res: AxiosResponse<ApiEnvelope<T[]>>): Paginated<T> {
  const data = (res.data?.data ?? []) as T[];
  const meta: PaginationMeta =
    res.data?.meta ?? {
      page: 1,
      limit: data.length,
      total: data.length,
      totalPages: 1,
    };
  return { data, meta };
}

export const apiGet = async <T>(url: string, params?: object): Promise<T> =>
  unwrap<T>(await api.get(url, { params }));

export const apiList = async <T>(url: string, params?: object): Promise<Paginated<T>> =>
  unwrapPaginated<T>(await api.get(url, { params }));

export const apiPost = async <T>(url: string, body?: object): Promise<T> =>
  unwrap<T>(await api.post(url, body));

export const apiPatch = async <T>(url: string, body?: object): Promise<T> =>
  unwrap<T>(await api.patch(url, body));

export const apiPut = async <T>(url: string, body?: object): Promise<T> =>
  unwrap<T>(await api.put(url, body));

export const apiDelete = async <T = void>(url: string): Promise<T> =>
  unwrap<T>(await api.delete(url));
