"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { moderationService } from "@/services/reports.service";
import { formatRelativeTime } from "@/lib/format";
import { displayName } from "@/lib/user";
import type { ModerationLog } from "@/types";

export function ModerationLogs() {
  const [items, setItems] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    moderationService
      .logs({ limit: 20 })
      .then((res) => setItems(res.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>لاگ نظارت</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-1/3" />
            </div>
          ))
        ) : items.length === 0 ? (
          <p className="text-xs text-muted-foreground">لاگی ثبت نشده است.</p>
        ) : (
          items.map((l) => (
            <div key={l.id} className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
              <p className="text-sm">
                <span className="font-medium">
                  {displayName(l.moderator) || l.moderatorId.slice(0, 8)}
                </span>{" "}
                <span className="text-muted-foreground">{l.action}</span>{" "}
                <span className="font-medium">{l.targetType}</span>{" "}
                <code className="text-[10px] text-muted-foreground" dir="ltr">
                  {l.targetId.slice(0, 8)}…
                </code>
              </p>
              {l.reason ? (
                <p className="mt-1 text-[11px] text-muted-foreground">{l.reason}</p>
              ) : null}
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {formatRelativeTime(l.createdAt)}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
