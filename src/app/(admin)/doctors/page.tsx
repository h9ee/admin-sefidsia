"use client";

import { useEffect, useState } from "react";
import { Stethoscope, Trophy, BadgeCheck, Hourglass } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { DoctorsList } from "@/features/doctors/doctors-list";
import { doctorsService } from "@/services/doctors.service";
import { formatNumber, toPersianDigits } from "@/lib/format";
import { displayName, userInitials } from "@/lib/user";
import type { Doctor } from "@/types";

export default function DoctorsPage() {
  const [ranking, setRanking] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    doctorsService
      .leaderboard(50)
      .then(setRanking)
      .catch(() => setRanking([]))
      .finally(() => setLoading(false));
  }, []);

  const verified = ranking.filter((d) => d.verificationStatus === "approved").length;
  const pending = ranking.filter((d) => d.verificationStatus === "pending").length;

  return (
    <>
      <PageHeader
        title="پزشکان"
        description="مدیریت تایید پزشکان و مشاهده رتبه‌بندی فعال‌ترین‌ها."
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="کل پزشکان" value={ranking.length} icon={Stethoscope} />
        <StatCard label="تایید شده" value={verified} icon={BadgeCheck} />
        <StatCard label="در انتظار" value={pending} icon={Hourglass} />
        <StatCard
          label="فعال‌ترین"
          value={ranking[0] ? displayName(ranking[0].user) : "—"}
          icon={Trophy}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DoctorsList />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>رتبه‌بندی پزشکان</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-2 w-1/3" />
                  </div>
                </div>
              ))
            ) : ranking.length === 0 ? (
              <p className="text-xs text-muted-foreground">داده‌ای موجود نیست.</p>
            ) : (
              ranking.slice(0, 8).map((d, idx) => (
                <div key={d.id} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {toPersianDigits(idx + 1)}
                  </span>
                  <Avatar className="h-8 w-8">
                    {d.user?.avatar ? (
                      <AvatarImage src={d.user.avatar} alt={displayName(d.user)} />
                    ) : null}
                    <AvatarFallback>{userInitials(d.user)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{displayName(d.user)}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{d.specialty}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatNumber(d.answerCount)} پاسخ
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
