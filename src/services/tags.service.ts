import { apiDelete, apiGet, apiList, apiPatch, apiPost } from "@/lib/axios";
import type { Tag } from "@/types";

export type TagsQuery = {
  page?: number;
  limit?: number;
  q?: string;
  sortBy?: "usageCount" | "followerCount" | "createdAt" | "name";
  sortOrder?: "ASC" | "DESC";
};

export const tagsService = {
  list(params: TagsQuery = {}) {
    return apiList<Tag>("/tags", params);
  },
  get(id: string) {
    return apiGet<Tag>(`/tags/${id}`);
  },
  create(payload: { name: string; slug?: string; description?: string }) {
    return apiPost<Tag>("/tags", payload);
  },
  update(
    id: string,
    payload: Partial<{ name: string; slug: string; description: string }>,
  ) {
    return apiPatch<Tag>(`/tags/${id}`, payload);
  },
  remove(id: string) {
    return apiDelete(`/tags/${id}`);
  },
};
