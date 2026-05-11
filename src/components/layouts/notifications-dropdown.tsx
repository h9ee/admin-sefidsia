"use client";

import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotificationsStore } from "@/store/notifications.store";
import { notificationsService } from "@/services/notifications.service";
import { formatRelativeTime, toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/cn";

export function NotificationsDropdown() {
  const items = useNotificationsStore((s) => s.items);
  const setItems = useNotificationsStore((s) => s.setItems);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const markRead = useNotificationsStore((s) => s.markRead);
  const unread = useNotificationsStore((s) => s.unreadCount());

  useEffect(() => {
    let active = true;
    notificationsService
      .list({ perPage: 8 })
      .then((res) => {
        if (active) setItems(res.data);
      })
      .catch(() => {
        // Silent fail; backend may not be ready
      });
    return () => {
      active = false;
    };
  }, [setItems]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label="اعلان‌ها">
          <Bell />
          {unread > 0 ? (
            <span className="absolute -left-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {toPersianDigits(unread)}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b border-border p-3">
          <p className="text-sm font-semibold">اعلان‌ها</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              markAllRead();
              await notificationsService.markAllRead().catch(() => undefined);
            }}
            disabled={unread === 0}
          >
            <Check className="h-4 w-4" />
            خوانده شد
          </Button>
        </div>
        <ScrollArea className="max-h-80">
          {items.length === 0 ? (
            <p className="p-6 text-center text-xs text-muted-foreground">اعلان جدیدی نیست.</p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 p-3 transition-colors hover:bg-muted/40",
                    !n.read && "bg-muted/20",
                  )}
                  onClick={() => {
                    if (!n.read) {
                      markRead(n.id);
                      notificationsService.markRead(n.id).catch(() => undefined);
                    }
                  }}
                >
                  <span
                    className={cn(
                      "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                      n.read ? "bg-border" : "bg-primary",
                    )}
                  />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-xs font-medium leading-snug">{n.title}</p>
                    {n.body ? (
                      <p className="text-xs text-muted-foreground">{n.body}</p>
                    ) : null}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {translateKind(n.kind)}
                      </Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        <div className="border-t border-border p-2 text-center">
          <Link
            href="/notifications"
            className="text-xs text-foreground/80 hover:text-foreground"
          >
            مشاهده همه اعلان‌ها
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function translateKind(k: string): string {
  switch (k) {
    case "system":
      return "سیستم";
    case "report":
      return "گزارش";
    case "user":
      return "کاربر";
    case "article":
      return "مقاله";
    case "question":
      return "سوال";
    case "doctor":
      return "پزشک";
    default:
      return k;
  }
}
