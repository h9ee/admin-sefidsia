import type { Permission, User } from "@/types";
import { DEVELOPER_ROLE_SLUG } from "@/types/permission";

export function isDeveloper(user: User | null): boolean {
  if (!user) return false;
  return user.roles?.some((r) => r.slug === DEVELOPER_ROLE_SLUG) ?? false;
}

export function hasAny(
  user: User | null,
  granted: Permission[],
  required: Permission | Permission[] | undefined,
): boolean {
  if (!required || (Array.isArray(required) && required.length === 0)) return true;
  if (isDeveloper(user)) return true;
  const list = Array.isArray(required) ? required : [required];
  return list.some((p) => matches(granted, p));
}

export function hasAll(
  user: User | null,
  granted: Permission[],
  required: Permission | Permission[] | undefined,
): boolean {
  if (!required || (Array.isArray(required) && required.length === 0)) return true;
  if (isDeveloper(user)) return true;
  const list = Array.isArray(required) ? required : [required];
  return list.every((p) => matches(granted, p));
}

function matches(granted: Permission[], required: Permission): boolean {
  if (granted.includes(required)) return true;
  // Wildcard support: "users.*" matches "users.read", "users.update", etc.
  return granted.some((g) => {
    if (!g.endsWith(".*")) return false;
    const prefix = g.slice(0, -1);
    return required.startsWith(prefix);
  });
}
