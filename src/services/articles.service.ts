import { apiDelete, apiGet, apiList, apiPatch, apiPost } from "@/lib/axios";
import type { Article, ArticleStatus } from "@/types";

export type ArticlesQuery = {
  page?: number;
  limit?: number;
  q?: string;
  status?: ArticleStatus;
  tagId?: string;
  categoryId?: string;
  authorId?: string;
  isFeatured?: boolean;
  sortBy?: "publishedAt" | "createdAt" | "viewCount" | "likeCount";
  sortOrder?: "ASC" | "DESC";
};

export type CreateArticlePayload = {
  title: string;
  summary?: string;
  content: string;
  coverImage?: string;
  categoryId?: string;
  tagIds?: string[];
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  requireMedicalReview?: boolean;
};

export type ReviewArticleStatus = "approved" | "rejected" | "needs_changes";

export const articlesService = {
  list(params: ArticlesQuery = {}) {
    return apiList<Article>("/articles", params);
  },
  getBySlug(slug: string) {
    return apiGet<Article>(`/articles/${slug}`);
  },
  create(payload: CreateArticlePayload) {
    return apiPost<Article>("/articles", payload);
  },
  update(id: string, payload: Partial<CreateArticlePayload>) {
    return apiPatch<Article>(`/articles/${id}`, payload);
  },
  remove(id: string) {
    return apiDelete(`/articles/${id}`);
  },
  publish(id: string) {
    return apiPost<Article>(`/articles/${id}/publish`);
  },
  review(id: string, status: ReviewArticleStatus, comment?: string) {
    return apiPost(`/articles/${id}/review`, { status, comment });
  },
};
