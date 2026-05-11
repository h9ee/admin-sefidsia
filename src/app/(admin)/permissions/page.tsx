"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { rolesService } from "@/services/roles.service";
import { defaultPermissionGroups } from "@/config/permissions";
import type { PermissionGroup } from "@/types";

export default function PermissionsPage() {
  const [groups, setGroups] = useState<PermissionGroup[]>(defaultPermissionGroups);

  useEffect(() => {
    rolesService.permissionGroups().then(setGroups).catch(() => undefined);
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
                    key={p.key}
                    className="flex items-center justify-between rounded-md border border-border px-2.5 py-1.5"
                  >
                    <span className="text-sm">{p.label}</span>
                    <code className="text-[11px] text-muted-foreground" dir="ltr">
                      {p.key}
                    </code>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
