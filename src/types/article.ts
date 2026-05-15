import type { User } from "./auth";

export type ArticleStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "rejected"
  | "archived";

export type MedicalReviewStatus = "not_required" | "pending" | "approved" | "rejected";

export type Tag = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  usageCount?: number;
  followerCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  coverImage: string | null;
  authorId: string;
  reviewedByDoctorId: string | null;
  categoryId: string | null;
  status: ArticleStatus;
  medicalReviewStatus: MedicalReviewStatus;
  isFeatured: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  readingTime: number;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author?: User;
  reviewer?: User | null;
  category?: Category | null;
  tags?: Tag[];
};
