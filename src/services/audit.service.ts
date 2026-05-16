import { apiList } from "@/lib/axios";
import type { AuditLog } from "@/types";

export type AuditQuery = {
  page?: number;
  limit?: number;
  userId?: number;
  entity?: string;
  entityId?: number;
  action?: string;
  /** ISO date string */
  from?: string;
  /** ISO date string */
  to?: string;
};

export const auditService = {
  list(params: AuditQuery = {}) {
    return apiList<AuditLog>("/audit", params);
  },
};
