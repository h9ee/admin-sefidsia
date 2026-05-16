import type { User } from "./auth";

export type ErrorLogLevel = "error" | "warn" | "critical";

export type ErrorLog = {
  id: number;
  level: ErrorLogLevel;
  statusCode: number | null;
  code: string | null;
  name: string | null;
  message: string;
  messageFa: string;
  stack: string | null;
  source: string;
  method: string | null;
  path: string | null;
  url: string | null;
  query: Record<string, unknown> | null;
  body: Record<string, unknown> | null;
  params: Record<string, unknown> | null;
  details: unknown | null;
  userId: number | null;
  ip: string | null;
  userAgent: string | null;
  resolved: boolean;
  resolvedAt: string | null;
  resolvedBy: number | null;
  createdAt: string;
  user?: Pick<User, "id" | "username"> & {
    name?: string | null;
    email?: string | null;
  };
  resolver?: Pick<User, "id" | "username"> & { name?: string | null };
};

export type ErrorLogStats = {
  total: number;
  unresolved: number;
  last24h: number;
  critical: number;
};
