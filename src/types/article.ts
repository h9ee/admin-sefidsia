import type { User } from "./auth";

export type ArticleStatus =
  | "draft"
  | "pending_review"
  | "scheduled"
  | "published"
  | "rejected"
  | "archived";

export type MedicalReviewStatus =
  | "not_required"
  | "pending"
  | "approved"
  | "rejected";

export type ContentType =
  | "guide"
  | "news"
  | "explainer"
  | "research_summary"
  | "opinion"
  | "case_study";

export type AudienceLevel =
  | "general"
  | "patient"
  | "caregiver"
  | "professional";

export type AudienceAge = "all" | "children" | "teen" | "adult" | "senior";

export type ContentWarning =
  | "none"
  | "medical_advice_required"
  | "sensitive"
  | "urgent"
  | "graphic";

export type TwitterCardType = "summary" | "summary_large_image";

export type FaqItem = {
  question: string;
  answer: string;
};

export type ReferenceItem = {
  title: string;
  url?: string;
  doi?: string;
  pmid?: string;
  authors?: string;
  year?: number;
  publisher?: string;
};

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
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parentId: number | null;
  createdAt?: string;
  updatedAt?: string;
};

/** Server-built nested tree node (GET /categories?tree=true). */
export type CategoryNode = Category & {
  depth: number;
  articleCount?: number;
  children: CategoryNode[];
};

export const MAX_CATEGORY_DEPTH = 4;

export type Article = {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  summary: string | null;
  content: string;
  coverImage: string | null;
  coverImageAlt: string | null;

  authorId: string;
  reviewedByDoctorId: string | null;
  categoryId: number | null;

  status: ArticleStatus;
  medicalReviewStatus: MedicalReviewStatus;
  isFeatured: boolean;
  publishedAt: string | null;
  scheduledAt: string | null;
  lastReviewedAt: string | null;

  allowComments: boolean;
  allowReactions: boolean;

  viewCount: number;
  likeCount: number;
  commentCount: number;
  readingTime: number;

  contentType: ContentType;
  audienceLevel: AudienceLevel;
  audienceAge: AudienceAge;
  contentWarning: ContentWarning;
  disclaimer: string | null;

  keyTakeaways: string[] | null;
  faq: FaqItem[] | null;
  references: ReferenceItem[] | null;

  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  focusKeyword: string | null;

  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterCard: TwitterCardType | null;

  createdAt: string;
  updatedAt: string;
  author?: User;
  reviewer?: User | null;
  category?: Category | null;
  tags?: Tag[];
};
