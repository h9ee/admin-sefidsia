"use client";

import { useEffect, useState } from "react";
import { Inbox, AlertTriangle, Star, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ticketsService } from "@/services";
import type { TicketStats } from "@/types";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/cn";

export function TicketsStats() {
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    ticketsService
      .stats()
      .then((s) => alive && setStats(s))
      .catch(() => alive && setStats(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<Inbox className="h-4 w-4" />}
        label="باز / در حال بررسی"
        value={stats.open}
        tone="default"
      />
      <StatCard
        icon={<AlertTriangle className="h-4 w-4" />}
        label="بدون مسئول"
        value={stats.unassigned}
        tone="warning"
      />
      <StatCard
        icon={<TrendingUp className="h-4 w-4" />}
        label="ثبت‌شده در ۷ روز اخیر"
        value={stats.createdLast7}
        tone="default"
      />
      <StatCard
        icon={<Star className="h-4 w-4" />}
        label="میانگین رضایت"
        value={
          stats.avgRating != null
            ? `${toPersianDigits(stats.avgRating.toFixed(1))} / ۵`
            : "—"
        }
        tone="default"
        bare
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
  bare,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone: "default" | "warning";
  bare?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 flex items-center gap-3",
        tone === "warning"
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-border"
      )}
    >
      <div
        className={cn(
          "size-9 rounded-md flex items-center justify-center",
          tone === "warning"
            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            : "bg-muted text-foreground/80"
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-bold tabular-nums leading-tight mt-0.5">
          {bare ? value : toPersianDigits(value)}
        </div>
      </div>
    </div>
  );
}
