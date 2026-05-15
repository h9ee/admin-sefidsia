"use client";

import { useCallback, useMemo } from "react";
import { useAuthStore } from "@/store/auth.store";
import { extractPermissionSlugs, hasAll, hasAny, isDeveloper } from "@/lib/permissions";
import type { PermissionSlug } from "@/types";

export function usePermission() {
  const user = useAuthStore((s) => s.user);
  const permissions = useMemo(() => extractPermissionSlugs(user), [user]);

  const can = useCallback(
    (required: PermissionSlug | PermissionSlug[] | undefined) =>
      hasAny(user, permissions, required),
    [user, permissions],
  );
  const canAll = useCallback(
    (required: PermissionSlug | PermissionSlug[] | undefined) =>
      hasAll(user, permissions, required),
    [user, permissions],
  );

  return useMemo(
    () => ({
      user,
      permissions,
      isDeveloper: isDeveloper(user),
      can,
      canAll,
    }),
    [user, permissions, can, canAll],
  );
}
