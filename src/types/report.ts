export type ReportStatus = "pending" | "reviewed" | "actioned" | "dismissed";

export type ReportTargetType = "article" | "question" | "answer" | "comment" | "user";

export type Report = {
  id: string;
  reason: string;
  description?: string;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle?: string;
  reporterName?: string;
  isDangerous: boolean;
  status: ReportStatus;
  reviewedBy?: string;
  reviewedAt?: string | null;
  createdAt: string;
};

export type ModerationLog = {
  id: string;
  action: string;
  actor: string;
  targetType: string;
  targetId: string;
  note?: string;
  createdAt: string;
};
