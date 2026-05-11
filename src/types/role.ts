import type { Permission } from "./permission";

export type Role = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  permissions: Permission[];
  usersCount?: number;
  isSystem?: boolean;
  createdAt: string;
};
