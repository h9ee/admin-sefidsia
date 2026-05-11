"use client";

import { type ReactNode } from "react";
import { usePermission } from "@/hooks/use-permission";
import type { Permission } from "@/types";

type Props = {
  permission?: Permission | Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
};

export function PermissionGuard({ permission, requireAll, fallback = null, children }: Props) {
  const { can, canAll } = usePermission();
  const allowed = requireAll ? canAll(permission) : can(permission);
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
