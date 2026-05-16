import { apiDelete, apiGet, apiList, apiPatch } from "@/lib/axios";
import type { ErrorLog, ErrorLogLevel, ErrorLogStats } from "@/types";

export type ErrorLogsQuery = {
  page?: number;
  limit?: number;
  level?: ErrorLogLevel;
  statusCode?: number;
  code?: string;
  userId?: number;
  resolved?: boolean;
  search?: string;
  from?: string;
  to?: string;
};

export const errorLogsService = {
  list(params: ErrorLogsQuery = {}) {
    return apiList<ErrorLog>("/error-logs", params);
  },
  stats() {
    return apiGet<ErrorLogStats>("/error-logs/stats");
  },
  detail(id: number) {
    return apiGet<ErrorLog>(`/error-logs/${id}`);
  },
  resolve(id: number) {
    return apiPatch<ErrorLog>(`/error-logs/${id}/resolve`);
  },
  unresolve(id: number) {
    return apiPatch<ErrorLog>(`/error-logs/${id}/unresolve`);
  },
  remove(id: number) {
    return apiDelete<{ id: number }>(`/error-logs/${id}`);
  },
  clearResolved() {
    return apiDelete<{ removed: number }>("/error-logs/clear-resolved");
  },
};
