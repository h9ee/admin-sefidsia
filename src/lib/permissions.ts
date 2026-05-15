import type { PermissionSlug, User } from "@/types";
import { ADMIN_ROLE_SLUG, DEVELOPER_ROLE_SLUG } from "@/types/permission";

export function isDeveloper(user: User | null): boolean {
  if (!user) return false;
  return user.roles?.some((r) => r.slug === DEVELOPER_ROLE_SLUG) ?? false;
}

export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.roles?.some((r) => r.slug === ADMIN_ROLE_SLUG) ?? false;
}

/**
 * Derive the flat permission-slug list from a user's roles.
 * Backend response embeds `roles[].permissions[]`.
 */
export function extractPermissionSlugs(user: User | null): PermissionSlug[] {
  if (!user?.roles) return [];
  const set = new Set<string>();
  for (const role of user.roles) {
    for (const p of role.permissions ?? []) {
      set.add(p.slug);
    }
  }
  return Array.from(set);
}

export function hasAny(
  user: User | null,
  granted: PermissionSlug[],
  required: PermissionSlug | PermissionSlug[] | undefined,
): boolean {
  if (!required || (Array.isArray(required) && required.length === 0)) return true;
  if (isDeveloper(user)) return true;
  const list = Array.isArray(required) ? required : [required];
  return list.some((p) => matches(granted, p));
}

export function hasAll(
  user: User | null,
  granted: PermissionSlug[],
  required: PermissionSlug | PermissionSlug[] | undefined,
): boolean {
  if (!required || (Array.isArray(required) && required.length === 0)) return true;
  if (isDeveloper(user)) return true;
  const list = Array.isArray(required) ? required : [required];
  return list.every((p) => matches(granted, p));
}

function matches(granted: PermissionSlug[], required: PermissionSlug): boolean {
  if (granted.includes(required)) return true;
  return granted.some((g) => {
    if (!g.endsWith(".*")) return false;
    const prefix = g.slice(0, -1);
    return required.startsWith(prefix);
  });
}
