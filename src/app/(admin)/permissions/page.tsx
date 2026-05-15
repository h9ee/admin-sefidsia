"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { permissionsService } from "@/services/roles.service";
import { groupPermissions, fallbackPermissionGroups } from "@/config/permissions";
import { parseApiError } from "@/lib/api-error";
import { toast } from "sonner";
import type { PermissionGroup } from "@/types";

export default function PermissionsPage() {
  const [groups, setGroups] = useState<PermissionGroup[]>(fallbackPermissionGroups);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    permissionsService
      .list()
      .then((items) => setGroups(groupPermissions(items)))
      .catch((e) => toast.error(parseApiError(e).message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        title="دسترسی‌ها"
        description="فهرست تمامی دسترسی‌های قابل تخصیص در سامانه."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => (
          <Card key={g.key}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{g.label}</span>
                <Badge variant="muted">{g.permissions.length} مورد</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {g.permissions.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-md border border-border px-2.5 py-1.5"
                  >
                    <span className="text-sm">{p.name}</span>
                    <code className="text-[11px] text-muted-foreground" dir="ltr">
                      {p.slug}
                    </code>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
        {loading && groups.length === 0 ? (
          <p className="text-xs text-muted-foreground">در حال بارگذاری…</p>
        ) : null}
      </div>
    </>
  );
}
