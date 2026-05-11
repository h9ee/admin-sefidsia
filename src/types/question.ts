import type { Tag } from "./article";

export type QuestionStatus = "open" | "closed" | "hidden" | "review";

export type Question = {
  id: string;
  title: string;
  body: string;
  isAnonymous: boolean;
  authorName?: string;
  authorAvatar?: string | null;
  status: QuestionStatus;
  isDangerous: boolean;
  isTrending: boolean;
  isHot: boolean;
  tags: Tag[];
  answersCount: number;
  views: number;
  createdAt: string;
};

export type Answer = {
  id: string;
  questionId: string;
  questionTitle?: string;
  body: string;
  authorName?: string;
  authorAvatar?: string | null;
  isDoctor?: boolean;
  isAccepted?: boolean;
  status: "visible" | "hidden" | "review";
  createdAt: string;
};

export type Comment = {
  id: string;
  parentType: "article" | "question" | "answer";
  parentId: string;
  body: string;
  authorName?: string;
  authorAvatar?: string | null;
  status: "visible" | "hidden" | "review";
  createdAt: string;
};
