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
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { dashboardService } from "@/services/dashboard.service";
import { formatRelativeTime } from "@/lib/format";
import type { DashboardData } from "@/types";

const fallback: DashboardData = {
  stats: { users: 0, articles: 0, questions: 0, doctors: 0, reports: 0, pendingDoctors: 0 },
  trafficLast7Days: [],
  contentBreakdown: [],
  latestUsers: [],
  latestArticles: [],
  latestReports: [],
  activity: [],
};

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    dashboardService
      .overview()
      .then((d) => active && setData(d))
      .catch(() => active && setData(fallback))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const stats = data?.stats ?? fallback.stats;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      >
        <StatCard label="کاربران" value={stats.users} icon={Users} />
        <StatCard label="پزشکان" value={stats.doctors} icon={Stethoscope} />
        <StatCard label="مقالات" value={stats.articles} icon={FileText} />
        <StatCard label="سوالات" value={stats.questions} icon={MessageSquare} />
        <StatCard label="گزارش‌ها" value={stats.reports} icon={Flag} />
        <StatCard label="در انتظار تایید" value={stats.pendingDoctors} icon={CircleAlert} />
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>روند بازدید ۷ روز اخیر</CardTitle>
              <CardDescription>تعداد کل بازدیدها بر اساس روز</CardDescription>
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-foreground">
            {loading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <AreaChart data={data?.trafficLast7Days ?? []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزیع محتوا</CardTitle>
            <CardDescription>تفکیک کلی محتوای فعال</CardDescription>
          </CardHeader>
          <CardContent className="text-foreground">
            {loading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <BarChart data={data?.contentBreakdown ?? []} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>آخرین کاربران</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <ListSkeleton />
            ) : data?.latestUsers.length ? (
              data.latestUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{u.fullName.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.fullName}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{u.email}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {formatRelativeTime(u.createdAt)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">داده‌ای موجود نیست.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>آخرین مقالات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <ListSkeleton />
            ) : data?.latestArticles.length ? (
              data.latestArticles.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/articles/${a.id}`}
                      className="line-clamp-1 text-sm font-medium hover:underline"
                    >
                      {a.title}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {a.authorName ?? "—"} · {formatRelativeTime(a.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">داده‌ای موجود نیست.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>گزارش‌های اخیر</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <ListSkeleton />
            ) : data?.latestReports.length ? (
              data.latestReports.map((r) => (
                <div key={r.id} className="flex items-start gap-2">
                  <Flag className={`mt-0.5 h-4 w-4 ${r.isDangerous ? "text-destructive" : "text-muted-foreground"}`} />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-sm font-medium">{r.reason}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {r.targetType}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(r.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">گزارشی وجود ندارد.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>فعالیت‌های اخیر</CardTitle>
          <CardDescription>رویدادهای ثبت شده در سامانه</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <ListSkeleton rows={5} />
          ) : data?.activity.length ? (
            <ol className="space-y-3">
              {data.activity.map((e) => (
                <li key={e.id} className="flex items-center gap-3">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback>{e.actor.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{e.actor}</span>{" "}
                      <span className="text-muted-foreground">{e.action}</span>{" "}
                      {e.target ? <span className="font-medium">{e.target}</span> : null}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {formatRelativeTime(e.createdAt)}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-xs text-muted-foreground">رویداد جدیدی ثبت نشده است.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
