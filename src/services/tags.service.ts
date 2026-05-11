import { api } from "@/lib/axios";
import type { Paginated, Tag } from "@/types";

export const tagsService = {
  async list(params: { page?: number; perPage?: number; search?: string } = {}) {
    const { data } = await api.get<Paginated<Tag>>("/admin/tags", { params });
    return data;
  },
  async create(payload: Pick<Tag, "name" | "slug">) {
    const { data } = await api.post<Tag>("/admin/tags", payload);
    return data;
  },
  async update(id: string, payload: Partial<Tag>) {
    const { data } = await api.patch<Tag>(`/admin/tags/${id}`, payload);
    return data;
  },
  async remove(id: string) {
    await api.delete(`/admin/tags/${id}`);
  },
};
