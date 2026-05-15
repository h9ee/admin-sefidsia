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
};

export type CreateQuestionPayload = {
  title: string;
  body: string;
  isAnonymous?: boolean;
  tagIds?: string[];
  medicalWarningLevel?: MedicalWarningLevel;
  seoTitle?: string;
  seoDescription?: string;
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

export const answersService = {
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
