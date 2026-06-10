"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  MessageSquare,
  Stethoscope,
  TrendingUp,
} from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { answersService, type AnswerStats } from "@/services/questions.service";
import { toPersianDigits } from "@/lib/format";

/**
 * Header row above the moderation listing. Loads once on mount — caller
 * can pass a `refreshKey` (e.g. the inspector's filter signature) to force
 * a re-fetch after destructive bulk actions, but the default load-on-mount
 * is enough for normal use.
 */
export function AnswersStats({ refreshKey }: { refreshKey?: string }) {
  const [stats, setStats] = useState<AnswerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    answersService
      .stats()
      .then((s) => {
        if (alive) setStats(s);
      })
      .catch(() => {
        // Silent — stats are decorative; the inspector still loads.
        if (alive) setStats(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard label="کل پاسخ‌ها" value={stats.total} icon={MessageSquare} />
      <StatCard label="امروز" value={stats.today} icon={CalendarRange} />
      <StatCard
        label="هفت روز اخیر"
        value={stats.last7d}
        icon={TrendingUp}
      />
      <StatCard
        label="سهم پاسخ پزشک"
        value={`${toPersianDigits(stats.doctorAnswerShare)}٪`}
        icon={Stethoscope}
      />
      <StatCard
        label="نرخ پذیرفته‌شده"
        value={`${toPersianDigits(stats.acceptedRate)}٪`}
        icon={CheckCircle2}
      />
      <StatCard
        label="گزارش‌های باز"
        value={stats.pendingReports}
        icon={AlertTriangle}
      />
    </div>
  );
}
