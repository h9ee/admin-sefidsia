"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Stethoscope } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { answersService } from "@/services/questions.service";
import { displayName, userInitials } from "@/lib/user";
import { formatRelativeTime } from "@/lib/format";
import type { Answer } from "@/types";

/**
 * Dashboard widget — last N doctor answers across the site. Quick glance
 * for admins to see whether the medical team is engaged. Clicking a row
 * jumps into the moderation page filtered to that question.
 */
export function RecentDoctorAnswers({ limit = 5 }: { limit?: number }) {
  const [items, setItems] = useState<Answer[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    answersService
      .list({
        isDoctorAnswer: true,
        status: "active",
        sortBy: "createdAt",
        sortOrder: "DESC",
        limit,
        page: 1,
      })
      .then((res) => {
        if (alive) setItems(res.data);
      })
      .catch(() => {
        if (alive) setItems([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [limit]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="inline-flex items-center gap-2 text-base">
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
            پاسخ‌های اخیر پزشک
          </CardTitle>
          <CardDescription className="text-xs">
            تازه‌ترین پاسخ‌های فعالِ ثبت‌شده توسط پزشک‌ها
          </CardDescription>
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link href="/answers">مشاهده همه</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <>
            {Array.from({ length: limit }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </>
        ) : !items || items.length === 0 ? (
          <EmptyState
            title="پاسخ پزشک ثبت نشده"
            description="پاسخ‌های جدیدِ پزشک‌ها اینجا ظاهر می‌شوند."
          />
        ) : (
          <ul className="space-y-2">
            {items.map((a) => (
              <li
                key={a.id}
                className="flex items-start gap-2 rounded-md border border-border bg-card/40 p-2 hover:bg-accent/40"
              >
                <Avatar className="h-7 w-7">
                  {a.author?.avatar ? (
                    <AvatarImage
                      src={a.author.avatar}
                      alt={displayName(a.author)}
                    />
                  ) : null}
                  <AvatarFallback>{userInitials(a.author)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="truncate font-medium">
                      {displayName(a.author)}
                    </span>
                    <span className="text-muted-foreground">
                      · {formatRelativeTime(a.createdAt)}
                    </span>
                    {a.isAccepted ? (
                      <Badge variant="success" className="ms-1">
                        پذیرفته‌شده
                      </Badge>
                    ) : null}
                  </div>
                  {a.question ? (
                    <Link
                      href={`/questions/${a.question.id}`}
                      className="block truncate text-xs text-muted-foreground hover:text-foreground"
                    >
                      {a.question.title}
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
