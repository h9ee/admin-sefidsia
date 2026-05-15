import { apiGet, apiList, apiPatch, apiPost } from "@/lib/axios";
import type {
  ModerationAction,
  ModerationLog,
  Report,
  ReportStatus,
  ReportTargetType,
} from "@/types";

export type ReportsQuery = {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  sortBy?: "createdAt" | "status";
  sortOrder?: "ASC" | "DESC";
};

export const reportsService = {
  list(params: ReportsQuery = {}) {
    return apiList<Report>("/reports", params);
  },
  create(payload: {
    targetType: ReportTargetType;
    targetId: string;
    reason: string;
    description?: string;
  }) {
    return apiPost<Report>("/reports", payload);
  },
  review(id: string, status: "reviewed" | "rejected" | "resolved", note?: string) {
    return apiPatch<Report>(`/reports/${id}/review`, { status, note });
  },
};

export const moderationService = {
  act(payload: {
    targetType: "article" | "question" | "answer" | "comment";
    targetId: string;
    action: ModerationAction;
    reason?: string;
  }) {
    return apiPost<{ ok: boolean }>("/moderation", payload);
  },
  logs(params: { page?: number; limit?: number } = {}) {
    return apiList<ModerationLog>("/moderation/logs", params);
  },
  /**
   * Convenience helper combining moderation + report status update.
   * Note: backend's moderation endpoint does not support "user" targets — those
   * have to be handled through `/users/:id` directly.
   */
  async hideReportTarget(report: Report, reason?: string) {
    if (report.targetType !== "user") {
      await this.act({
        targetType: report.targetType,
        targetId: report.targetId,
        action: "hide",
        reason,
      });
    }
    return reportsService.review(report.id, "resolved", reason);
  },
  async restoreReportTarget(report: Report, reason?: string) {
    if (report.targetType !== "user") {
      await this.act({
        targetType: report.targetType,
        targetId: report.targetId,
        action: "restore",
        reason,
      });
    }
    return reportsService.review(report.id, "reviewed", reason);
  },
};
