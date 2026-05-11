export type Permission = string;

export type PermissionGroup = {
  key: string;
  label: string;
  permissions: { key: Permission; label: string }[];
};

export const DEVELOPER_ROLE_SLUG = "developer";
