import type { User } from "./auth";

export type ReportStatus = "pending" | "reviewed" | "rejected" | "resolved";
export type ReportTargetType = "article" | "question" | "answer" | "comment" | "user";

export type Report = {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt?: string;
  reporter?: User;
};

export type ModerationAction = "hide" | "restore" | "delete";

export type ModerationLog = {
  id: string;
  moderatorId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  createdAt: string;
  moderator?: User;
};
