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
export const MODERATOR_ROLE_SLUG = "moderator";

/** Whitelist of role slugs allowed to enter the admin panel. */
export const ADMIN_PANEL_ROLES = [
  DEVELOPER_ROLE_SLUG,
  ADMIN_ROLE_SLUG,
  MODERATOR_ROLE_SLUG,
] as const;
