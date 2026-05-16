import type { User } from "./auth";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "restore"
  | "publish"
  | "review"
  | "verify"
  | "reject"
  | "assign"
  | "unassign"
  | "set"
  | "login"
  | "logout"
  | string;

export type AuditEntity =
  | "user"
  | "user.role"
  | "role"
  | "role.permission"
  | "permission"
  | "category"
  | "tag"
  | "article"
  | "doctor"
  | "report"
  | string;

export type AuditLog = {
  id: number;
  userId: number | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId: number | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: User | null;
};
