"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  FileText,
  Flag,
  MessageSquare,
  Stethoscope,
  Users,
  CircleAlert,
  Tags as TagsIcon,
  Hourglass,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/shared/stat-card";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { dashboardService } from "@/services/dashboard.service";
import { toPersianDigits } from "@/lib/format";
import type { ChartPoint, DashboardData, StatsRange } from "@/types";

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [stats, setStats] = useState<StatsRange | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(30);

  useEffect(() => {
    let active = true;
    Promise.all([
      dashboardService.overview().catch(() => null),
      dashboardService.stats(rangeDays).catch(() => null),
    ])
      .then(([d, s]) => {
        if (!active) return;
        setData(d);
        setStats(s);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [rangeDays]);

  const contentBreakdown: ChartPoint[] = data
    ? [
        { label: "مقاله", value: data.articles.total },
        { label: "سؤال", value: data.qa.totalQuestions },
        { label: "پاسخ", value: data.qa.totalAnswers },
        { label: "نظر", value: data.community.comments },
        { label: "برچسب", value: data.community.tags },
      ]
    : [];

  const trafficSeries: ChartPoint[] = stats
    ? [
        { label: "کاربران", value: stats.counts.users },
        { label: "مقالات", value: stats.counts.articles },
        { label: "سؤالات", value: stats.counts.questions },
        { label: "پاسخ‌ها", value: stats.counts.answers },
      ]
    : [];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      >
        <StatCard
          label="کل کاربران"
          value={data?.users.total ?? 0}
          icon={Users}
          delta={
            data ? (
              <span>
                {toPersianDigits(data.users.newLast7d)} عضو جدید ۷ روز اخیر
              </span>
            ) : null
          }
        />
        <StatCard
          label="پزشکان فعال"
          value={data?.doctors.active ?? 0}
          icon={Stethoscope}
        />
        <StatCard
          label="در انتظار تأیید"
          value={data?.doctors.pending ?? 0}
          icon={Hourglass}
        />
        <StatCard
          label="مقالات منتشر شده"
          value={data?.articles.published ?? 0}
          icon={FileText}
        />
        <StatCard
          label="سوالات"
          value={data?.qa.totalQuestions ?? 0}
          icon={MessageSquare}
        />
        <StatCard
          label="گزارش‌های جدید"
          value={data?.moderation.pendingReports ?? 0}
          icon={Flag}
        />
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>روند فعالیت {toPersianDigits(rangeDays)} روز اخیر</CardTitle>
              <CardDescription>
                مجموع کاربران، مقالات، سؤالات و پاسخ‌های ایجاد شده در بازه
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setRangeDays(d)}
                  className={`rounded-md border px-2.5 py-1 text-[11px] transition-colors ${
                    d === rangeDays
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {toPersianDigits(d)} روز
                </button>
              ))}
              <Activity className="ms-1 h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="text-foreground">
            {loading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <AreaChart data={trafficSeries} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزیع محتوا</CardTitle>
            <CardDescription>وضعیت کلی محتوا در پلتفرم</CardDescription>
          </CardHeader>
          <CardContent className="text-foreground">
            {loading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <BarChart data={contentBreakdown} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="کل مقالات" value={data?.articles.total ?? 0} icon={FileText} loading={loading} />
        <MiniStat
          label="در انتظار بازبینی"
          value={data?.articles.pendingReview ?? 0}
          icon={CircleAlert}
          loading={loading}
        />
        <MiniStat
          label="سؤالات بدون پاسخ"
          value={data?.qa.unansweredQuestions ?? 0}
          icon={MessageSquare}
          loading={loading}
        />
        <MiniStat
          label="کل برچسب‌ها"
          value={data?.community.tags ?? 0}
          icon={TagsIcon}
          loading={loading}
        />
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-[11px] text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-6 w-16" />
          ) : (
            <p className="text-lg font-semibold tabular-nums">{toPersianDigits(value)}</p>
          )}
        </div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}
