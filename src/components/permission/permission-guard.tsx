"use client";

import { type ReactNode } from "react";
import { usePermission } from "@/hooks/use-permission";
import type { PermissionSlug } from "@/types";

type Props = {
  permission?: PermissionSlug | PermissionSlug[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
};

export function PermissionGuard({ permission, requireAll, fallback = null, children }: Props) {
  const { canAll, canAny } = usePermission();
  // Default is OR (any of the listed permissions); `requireAll` switches to AND.
  const allowed = requireAll ? canAll(permission) : canAny(permission);
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
