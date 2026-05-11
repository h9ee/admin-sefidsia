export type ArticleStatus = "draft" | "published" | "review" | "archived";

export type Tag = {
  id: string;
  name: string;
  slug: string;
  count?: number;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  cover?: string | null;
  status: ArticleStatus;
  authorName?: string;
  doctorReviewStatus?: "pending" | "approved" | "rejected" | null;
  category?: Category;
  tags: Tag[];
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  views?: number;
  likes?: number;
};
