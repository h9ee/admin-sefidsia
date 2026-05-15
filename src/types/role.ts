import type { Permission } from "./permission";

export type Role = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isSystem: boolean;
  permissions?: Permission[];
  createdAt: string;
  updatedAt?: string;
};
