import { apiDelete, apiGet, apiList, apiPatch, apiPost } from "@/lib/axios";
import type {
  Article,
  ArticleStatus,
  AudienceAge,
  AudienceLevel,
  ContentType,
  ContentWarning,
  FaqItem,
  ReferenceItem,
  TwitterCardType,
} from "@/types";

export type ArticlesQuery = {
  page?: number;
  limit?: number;
  q?: string;
  /** `"all"` is a sentinel — the backend treats it as "no status filter". */
  status?: ArticleStatus | "all";
  tagId?: number;
  categoryId?: number;
  authorId?: string;
  reviewedByDoctorId?: number;
  contentType?: ContentType;
  audienceLevel?: AudienceLevel;
  contentWarning?: ContentWarning;
  isFeatured?: boolean;
  sortBy?:
    | "publishedAt"
    | "createdAt"
    | "viewCount"
    | "likeCount"
    | "scheduledAt";
  sortOrder?: "ASC" | "DESC";
};

export type CreateArticlePayload = {
  // Core
  title: string;
  subtitle?: string;
  summary?: string;
  content: string;
  content2?: string;
  content3?: string;
  url?: string;
  coverImage?: string;
  coverImageAlt?: string;

  // Taxonomy
  categoryId: number;
  tagIds?: string[];

  // Editorial classification
  contentType?: ContentType;
  audienceLevel?: AudienceLevel;
  audienceAge?: AudienceAge;
  contentWarning?: ContentWarning;
  disclaimer?: string;

  // Engagement
  allowComments?: boolean;
  allowReactions?: boolean;
  isFeatured?: boolean;

  // Rich blocks
  keyTakeaways?: string[];
  commonMistakes?: string[];
  faq?: FaqItem[];
  references?: ReferenceItem[];
  relatedArticleIds?: number[];

  // SEO
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  focusKeyword?: string;

  // Social overrides
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: TwitterCardType;

  // Medical review
  reviewedByDoctorId?: number | null;
  requireMedicalReview?: boolean;

  // Scheduling (ISO datetime)
  scheduledAt?: string | null;

  // Publication status — admin/developer can override the default workflow.
  status?: ArticleStatus;
};

export type ReviewArticleStatus = "approved" | "rejected" | "needs_changes";

export const articlesService = {
  list(params: ArticlesQuery = {}) {
    return apiList<Article>("/articles", params);
  },
  /**
   * Admin edit URLs use the dashed canonical form (matches the public
   * client). The backend's `url` column stores the space-separated form, so
   * we translate before the lookup — keeping the admin and the public site
   * in lockstep with a single convention.
   */
  getBySlug(slug: string) {
    const backendSlug = slug.replace(/-+/g, " ");
    return apiGet<Article>(`/articles/${encodeURIComponent(backendSlug)}`);
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
