export type Permission = {
  id: string;
  name: string;
  slug: string;
  module: string;
  action: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PermissionSlug = string;

export type PermissionGroup = {
  key: string;
  label: string;
  permissions: Permission[];
};

export const DEVELOPER_ROLE_SLUG = "developer";
export const ADMIN_ROLE_SLUG = "admin";
