import type { User } from "./auth";
import type { Tag } from "./article";

export type QuestionStatus = "open" | "answered" | "closed" | "duplicate" | "hidden";
export type MedicalWarningLevel = "normal" | "sensitive" | "urgent";

export type Question = {
  id: string;
  title: string;
  slug: string;
  body: string;
  userId: string;
  acceptedAnswerId: string | null;
  status: QuestionStatus;
  isAnonymous: boolean;
  viewCount: number;
  answerCount: number;
  voteScore: number;
  commentCount: number;
  medicalWarningLevel: MedicalWarningLevel;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt?: string;
  user?: User;
  tags?: Tag[];
};

export type AnswerStatus = "active" | "hidden" | "deleted";

export type Answer = {
  id: string;
  questionId: string;
  userId: string;
  body: string;
  isDoctorAnswer: boolean;
  isAccepted: boolean;
  voteScore: number;
  commentCount: number;
  status: AnswerStatus;
  createdAt: string;
  updatedAt?: string;
  author?: User;
};

export type CommentTargetType = "article" | "question" | "answer";
export type CommentStatus = "active" | "hidden" | "deleted";

export type Comment = {
  id: string;
  userId: string;
  targetType: CommentTargetType;
  targetId: string;
  body: string;
  status: CommentStatus;
  parentId: string | null;
  likeCount: number;
  createdAt: string;
  updatedAt?: string;
  author?: User;
  replies?: Comment[];
};
