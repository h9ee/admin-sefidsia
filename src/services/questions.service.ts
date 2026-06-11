import { apiDelete, apiGet, apiList, apiPatch, apiPost } from "@/lib/axios";
import type {
  Answer,
  AnswerStatus,
  Comment,
  CommentStatus,
  CommentTargetType,
  MedicalWarningLevel,
  Question,
  QuestionStatus,
} from "@/types";

export type QuestionsQuery = {
  page?: number;
  limit?: number;
  q?: string;
  status?: QuestionStatus;
  tagId?: string;
  authorId?: string;
  unanswered?: boolean;
  trending?: boolean;
  sortBy?: "createdAt" | "voteScore" | "answerCount" | "viewCount";
  sortOrder?: "ASC" | "DESC";
  /** ISO date strings for the createdAt range filter. */
  dateFrom?: string;
  dateTo?: string;
};

export type CreateQuestionPayload = {
  title: string;
  body: string;
  isAnonymous?: boolean;
  tagIds?: string[];
  /** Free-text tag names — backend auto-creates them as `pending`. */
  newTags?: string[];
  medicalWarningLevel?: MedicalWarningLevel;
  seoTitle?: string;
  seoDescription?: string;
  /** Cover/OG image URL or backend path. Empty string clears it. */
  ogImage?: string | null;
  /** Workflow status — backend applies it only for admin/developer roles. */
  status?: QuestionStatus;
  /** Canonical question id when marking as duplicate. `null` clears the link. */
  duplicateOfQuestionId?: number | null;
};

export const questionsService = {
  list(params: QuestionsQuery = {}) {
    return apiList<Question>("/questions", params);
  },
  getBySlug(slug: string) {
    return apiGet<Question>(`/questions/${slug}`);
  },
  related(id: string) {
    return apiGet<Question[]>(`/questions/${id}/related`);
  },
  create(payload: CreateQuestionPayload) {
    return apiPost<Question>("/questions", payload);
  },
  update(id: string, payload: Partial<CreateQuestionPayload>) {
    return apiPatch<Question>(`/questions/${id}`, payload);
  },
  remove(id: string) {
    return apiDelete(`/questions/${id}`);
  },
  acceptAnswer(questionId: string, answerId: string) {
    return apiPost<Question>(`/questions/${questionId}/accept-answer`, { answerId });
  },
};

export type AnswersQuery = {
  page?: number;
  limit?: number;
  q?: string;
  status?: AnswerStatus;
  isDoctorAnswer?: boolean;
  isAccepted?: boolean;
  /** Surface only answers with ≥1 pending report — drives the
   *  "گزارش‌شده" tab on the admin moderation page. */
  hasOpenReports?: boolean;
  authorId?: string;
  questionId?: string;
  sortBy?: "createdAt" | "voteScore" | "commentCount" | "openReportCount";
  sortOrder?: "ASC" | "DESC";
};

export type AnswerStats = {
  total: number;
  today: number;
  last7d: number;
  /** Percentage (0..100, one decimal place). */
  doctorAnswerShare: number;
  /** Percentage (0..100, one decimal place). */
  acceptedRate: number;
  pendingReports: number;
};

export const answersService = {
  /** Aggregate counters for the admin moderation page header. */
  stats() {
    return apiGet<AnswerStats>("/answers/stats");
  },
  /**
   * Global moderation listing (admin only). Backend includes the parent
   * question on each row so the table can link straight to it.
   */
  list(params: AnswersQuery = {}) {
    return apiList<Answer>("/answers", params);
  },
  listForQuestion(questionId: string) {
    return apiGet<Answer[]>(`/questions/${questionId}/answers`);
  },
  create(questionId: string, body: string) {
    return apiPost<Answer>(`/questions/${questionId}/answers`, { body });
  },
  update(id: string, payload: { body?: string; status?: AnswerStatus }) {
    return apiPatch<Answer>(`/answers/${id}`, payload);
  },
  remove(id: string) {
    return apiDelete(`/answers/${id}`);
  },
};

export const commentsService = {
  listForTarget(targetType: CommentTargetType, targetId: string) {
    return apiGet<Comment[]>("/comments", { targetType, targetId });
  },
  create(payload: {
    targetType: CommentTargetType;
    targetId: string;
    body: string;
    parentId?: string;
  }) {
    return apiPost<Comment>("/comments", payload);
  },
  update(id: string, payload: { body?: string; status?: CommentStatus }) {
    return apiPatch<Comment>(`/comments/${id}`, payload);
  },
  remove(id: string) {
    return apiDelete(`/comments/${id}`);
  },
};
