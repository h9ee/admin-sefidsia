"use client";

import { useCallback, useMemo } from "react";
import { useAuthStore } from "@/store/auth.store";
import { hasAll, hasAny, isDeveloper } from "@/lib/permissions";
import type { Permission } from "@/types";

export function usePermission() {
  const user = useAuthStore((s) => s.user);
  const permissions = useAuthStore((s) => s.permissions);

  const can = useCallback(
    (required: Permission | Permission[] | undefined) => hasAny(user, permissions, required),
    [user, permissions],
  );
  const canAll = useCallback(
    (required: Permission | Permission[] | undefined) => hasAll(user, permissions, required),
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
