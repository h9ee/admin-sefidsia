"use client";

import { useEffect, useState } from "react";
import { Award, Star, Trophy, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { gamificationService } from "@/services/gamification.service";
import { formatNumber, toPersianDigits } from "@/lib/format";
import { displayName, userInitials } from "@/lib/user";
import type { Badge as BadgeType, LeaderboardEntry } from "@/types";

const badgeTypeLabel: Record<string, string> = {
  user: "کاربر",
  doctor: "پزشک",
  article: "مقاله",
  question: "سؤال",
  answer: "پاسخ",
};

export default function GamificationPage() {
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      gamificationService.badges().catch(() => []),
      gamificationService.leaderboard({ limit: 20 }).catch(() => []),
    ])
      .then(([b, l]) => {
        setBadges(b);
        setLeaderboard(l);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalXp = leaderboard.reduce((s, e) => s + (e.xp ?? 0), 0);
  const topUser = leaderboard[0];

  return (
    <>
      <PageHeader
        title="گیمیفیکیشن"
        description="نشان‌ها، امتیازها و رتبه‌بندی کاربران پلتفرم."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="کل نشان‌ها" value={badges.length} icon={Award} />
        <StatCard label="مجموع امتیاز رتبه‌بندی" value={totalXp} icon={Star} />
        <StatCard
          label="کاربران رتبه‌بندی"
          value={leaderboard.length}
          icon={TrendingUp}
        />
        <StatCard
          label="کاربر برتر"
          value={topUser ? displayName(topUser) : "—"}
          icon={Trophy}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>نشان‌های فعال</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : badges.length === 0 ? (
              <EmptyState
                title="نشانی تعریف نشده است"
                description="هنوز هیچ نشانی در سامانه تعریف نشده است."
                className="border-0"
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {badges.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted text-foreground/80">
                      <Award className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{b.name}</p>
                        <Badge variant="muted" className="text-[10px]">
                          {badgeTypeLabel[b.type] ?? b.type}
                        </Badge>
                      </div>
                      {b.description ? (
                        <p className="line-clamp-2 text-[11px] text-muted-foreground">
                          {b.description}
                        </p>
                      ) : null}
                      <div className="flex items-center justify-between pt-1">
                        <code className="text-[10px] text-muted-foreground" dir="ltr">
                          {b.slug}
                        </code>
                        <span className="text-[11px] text-foreground/70">
                          +{toPersianDigits(b.xpReward)} XP
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>برترین‌های لیدربورد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-3 flex-1" />
                </div>
              ))
            ) : leaderboard.length === 0 ? (
              <p className="text-xs text-muted-foreground">داده‌ای موجود نیست.</p>
            ) : (
              leaderboard.slice(0, 10).map((u, idx) => (
                <div key={u.id} className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">
                    {toPersianDigits(idx + 1)}
                  </span>
                  <Avatar className="h-7 w-7">
                    {u.avatar ? <AvatarImage src={u.avatar} alt={displayName(u)} /> : null}
                    <AvatarFallback>{userInitials(u)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{displayName(u)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      سطح {toPersianDigits(u.level ?? 1)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {formatNumber(u.xp ?? 0)} XP
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
