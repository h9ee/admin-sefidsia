"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { notificationsService } from "@/services/notifications.service";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Notification } from "@/types";

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  const load = (read?: boolean) => {
    setLoading(true);
    notificationsService
      .list({ perPage: 50, read })
      .then((res) => setItems(res.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(tab === "all" ? undefined : tab === "unread" ? false : true);
  }, [tab]);

  return (
    <>
      <PageHeader
        title="اعلان‌ها"
        description="مرکز اعلان‌های سامانه"
        actions={
          <Button
            variant="outline"
            onClick={async () => {
              await notificationsService.markAllRead().catch(() => undefined);
              setItems((cur) => cur.map((n) => ({ ...n, read: true })));
              toast.success("همه اعلان‌ها خوانده شد");
            }}
          >
            <Check />
            علامت‌گذاری همه
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">همه</TabsTrigger>
          <TabsTrigger value="unread">خوانده نشده</TabsTrigger>
          <TabsTrigger value="read">خوانده شده</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-3 p-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <EmptyState
                  className="m-6 border-0"
                  title="اعلانی وجود ندارد"
                  description="هنوز هیچ اعلان جدیدی برای شما ثبت نشده است."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {items.map((n) => (
                    <li
                      key={n.id}
                      className={cn(
                        "flex items-start gap-3 p-4 transition-colors hover:bg-muted/30",
                        !n.read && "bg-muted/15",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                          n.read ? "bg-border" : "bg-primary",
                        )}
                      />
                      <div className="flex-1 space-y-0.5">
                        <p className="text-sm font-medium">{n.title}</p>
                        {n.body ? <p className="text-xs text-muted-foreground">{n.body}</p> : null}
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{formatRelativeTime(n.createdAt)}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {n.kind}
                          </Badge>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
