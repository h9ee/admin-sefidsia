import { apiDelete, apiGet, apiList, apiPatch, apiPost } from "@/lib/axios";
import type { Tag, TagStatus } from "@/types";

export type TagsQuery = {
  page?: number;
  limit?: number;
  q?: string;
  status?: TagStatus;
  sortBy?: "usageCount" | "followerCount" | "createdAt" | "name";
  sortOrder?: "ASC" | "DESC";
};

export type TagFormPayload = {
  name: string;
  slug?: string;
  /** Public canonical URL slug — unique. Defaults to `slug` server-side. */
  url?: string;
  /** Rich-text HTML. `null` clears the field; `undefined` leaves it unchanged. */
  description?: string | null;
  /** SEO overrides. Same null/undefined contract as `description`. */
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImage?: string | null;
  status?: TagStatus;
};

export const tagsService = {
  list(params: TagsQuery = {}) {
    return apiList<Tag>("/tags", params);
  },
  get(id: string) {
    return apiGet<Tag>(`/tags/${id}`);
  },
  create(payload: TagFormPayload) {
    return apiPost<Tag>("/tags", payload);
  },
  update(id: string, payload: Partial<TagFormPayload>) {
    return apiPatch<Tag>(`/tags/${id}`, payload);
  },
  remove(id: string) {
    return apiDelete(`/tags/${id}`);
  },
  approve(id: string) {
    return apiPost<Tag>(`/tags/${id}/approve`, {});
  },
  /** Re-point all usages of `id` onto `targetId`, then delete `id`. */
  merge(id: string, targetId: number | string) {
    return apiPost<Tag>(`/tags/${id}/merge`, { targetId: Number(targetId) });
  },
};
