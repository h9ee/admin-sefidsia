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

export const tagsService = {
  list(params: TagsQuery = {}) {
    return apiList<Tag>("/tags", params);
  },
  get(id: string) {
    return apiGet<Tag>(`/tags/${id}`);
  },
  create(payload: {
    name: string;
    slug?: string;
    description?: string;
    status?: TagStatus;
  }) {
    return apiPost<Tag>("/tags", payload);
  },
  update(
    id: string,
    payload: Partial<{
      name: string;
      slug: string;
      description: string;
      status: TagStatus;
    }>,
  ) {
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
