import { api } from "@/lib/axios";
import type { ModerationLog, Paginated, Report } from "@/types";

export type ReportsQuery = {
  page?: number;
  perPage?: number;
  status?: string;
  targetType?: string;
  dangerous?: boolean;
};

export const reportsService = {
  async list(params: ReportsQuery = {}) {
    const { data } = await api.get<Paginated<Report>>("/admin/reports", { params });
    return data;
  },
  async setStatus(id: string, status: Report["status"], note?: string) {
    const { data } = await api.patch<Report>(`/admin/reports/${id}/status`, { status, note });
    return data;
  },
  async hideTarget(report: Report, note?: string) {
    const { data } = await api.post<Report>(`/admin/reports/${report.id}/hide`, { note });
    return data;
  },
  async restoreTarget(report: Report, note?: string) {
    const { data } = await api.post<Report>(`/admin/reports/${report.id}/restore`, { note });
    return data;
  },
  async bulkAction(payload: { ids: string[]; action: "hide" | "restore" | "dismiss" }) {
    const { data } = await api.post(`/admin/reports/bulk`, payload);
    return data;
  },
  async logs(params: { page?: number; perPage?: number } = {}) {
    const { data } = await api.get<Paginated<ModerationLog>>("/admin/moderation-logs", { params });
    return data;
  },
};
