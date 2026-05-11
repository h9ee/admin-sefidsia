import { api } from "@/lib/axios";
import type { Answer, Comment, Paginated, Question, Tag } from "@/types";

export type QuestionsQuery = {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  tag?: string;
  dangerous?: boolean;
  trending?: boolean;
};

export const questionsService = {
  async list(params: QuestionsQuery = {}) {
    const { data } = await api.get<Paginated<Question>>("/admin/questions", { params });
    return data;
  },
  async get(id: string) {
    const { data } = await api.get<Question>(`/admin/questions/${id}`);
    return data;
  },
  async setStatus(id: string, status: Question["status"]) {
    const { data } = await api.patch<Question>(`/admin/questions/${id}/status`, { status });
    return data;
  },
  async toggleDangerous(id: string, value: boolean) {
    const { data } = await api.patch<Question>(`/admin/questions/${id}/dangerous`, { value });
    return data;
  },
  async setTags(id: string, tagIds: string[]) {
    const { data } = await api.patch<Question>(`/admin/questions/${id}/tags`, { tagIds });
    return data;
  },
  async listAnswers(params: {
    page?: number;
    perPage?: number;
    search?: string;
    status?: string;
  } = {}) {
    const { data } = await api.get<Paginated<Answer>>("/admin/answers", { params });
    return data;
  },
  async setAnswerStatus(id: string, status: Answer["status"]) {
    const { data } = await api.patch<Answer>(`/admin/answers/${id}/status`, { status });
    return data;
  },
  async listComments(params: {
    page?: number;
    perPage?: number;
    search?: string;
    status?: string;
  } = {}) {
    const { data } = await api.get<Paginated<Comment>>("/admin/comments", { params });
    return data;
  },
  async setCommentStatus(id: string, status: Comment["status"]) {
    const { data } = await api.patch<Comment>(`/admin/comments/${id}/status`, { status });
    return data;
  },
  async listTags() {
    const { data } = await api.get<Tag[]>("/admin/tags");
    return data;
  },
};
