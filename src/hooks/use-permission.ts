"use client";

import { useCallback, useMemo } from "react";
import { useAuthStore } from "@/store/auth.store";
import {
  extractPermissionSlugs,
  hasAll,
  hasAny,
  hasRole,
  isDeveloper,
} from "@/lib/permissions";
import type { PermissionSlug } from "@/types";

type Required = PermissionSlug | PermissionSlug[] | undefined;

/**
 * Permission-aware helpers, derived from the logged-in user's roles.
 *
 * - `can(x)`        → single slug, or array meaning **ALL** required (AND).
 * - `canAll(x)`     → explicit AND (alias of `can`).
 * - `canAny(x)`     → array meaning **ANY** required (OR).
 * - `hasRole(slug)` → literal role check.
 *
 * The `developer` role short-circuits every permission check to `true`.
 */
export function usePermission() {
  const user = useAuthStore((s) => s.user);
  const permissions = useMemo(() => extractPermissionSlugs(user), [user]);

  const can = useCallback(
    (required: Required) => hasAll(user, permissions, required),
    [user, permissions],
  );
  const canAny = useCallback(
    (required: Required) => hasAny(user, permissions, required),
    [user, permissions],
  );
  const role = useCallback((slug: string) => hasRole(user, slug), [user]);

  return useMemo(
    () => ({
      user,
      permissions,
      isDeveloper: isDeveloper(user),
      can,
      canAll: can,
      canAny,
      hasRole: role,
    }),
    [user, permissions, can, canAny, role],
  );
}
