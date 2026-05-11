import { api } from "@/lib/axios";
import type { Article, Category, Paginated, Tag } from "@/types";

export type ArticlesQuery = {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  tag?: string;
  category?: string;
};

export const articlesService = {
  async list(params: ArticlesQuery = {}) {
    const { data } = await api.get<Paginated<Article>>("/admin/articles", { params });
    return data;
  },
  async get(id: string) {
    const { data } = await api.get<Article>(`/admin/articles/${id}`);
    return data;
  },
  async create(payload: Partial<Article>) {
    const { data } = await api.post<Article>("/admin/articles", payload);
    return data;
  },
  async update(id: string, payload: Partial<Article>) {
    const { data } = await api.patch<Article>(`/admin/articles/${id}`, payload);
    return data;
  },
  async remove(id: string) {
    await api.delete(`/admin/articles/${id}`);
  },
  async setStatus(id: string, status: Article["status"]) {
    const { data } = await api.patch<Article>(`/admin/articles/${id}/status`, { status });
    return data;
  },
  async uploadCover(id: string, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await api.post<{ url: string }>(`/admin/articles/${id}/cover`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.url;
  },
  async listTags() {
    const { data } = await api.get<Tag[]>("/admin/tags");
    return data;
  },
  async listCategories() {
    const { data } = await api.get<Category[]>("/admin/categories");
    return data;
  },
};
