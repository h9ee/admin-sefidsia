"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Eye,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/tables/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { errorLogsService } from "@/services/error-logs.service";
import { parseApiError } from "@/lib/api-error";
import { formatDateTime, formatRelativeTime, toPersianDigits } from "@/lib/format";
import type {
  ErrorLog,
  ErrorLogLevel,
  ErrorLogStats,
  Paginated,
} from "@/types";
import { ErrorLogDetailDialog } from "./error-log-detail";

type ResolvedFilter = "all" | "unresolved" | "resolved";

const LEVEL_META: Record<
  ErrorLogLevel,
  { label: string; className: string; icon: typeof AlertCircle }
> = {
  critical: {
    label: "بحرانی",
    className:
      "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
    icon: ShieldAlert,
  },
  error: {
    label: "خطا",
    className:
      "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400",
    icon: AlertCircle,
  },
  warn: {
    label: "هشدار",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    icon: AlertTriangle,
  },
};

const METHOD_CLASS: Record<string, string> = {
  GET: "text-emerald-600 dark:text-emerald-400",
  POST: "text-sky-600 dark:text-sky-400",
  PUT: "text-amber-600 dark:text-amber-400",
  PATCH: "text-amber-600 dark:text-amber-400",
  DELETE: "text-red-600 dark:text-red-400",
};

type Row = Omit<ErrorLog, "id"> & { id: string; _id: number };

const toRow = (e: ErrorLog): Row => ({ ...e, _id: e.id, id: String(e.id) });

export function ErrorLogsList() {
  const [data, setData] = useState<Paginated<ErrorLog> | null>(null);
  const [stats, setStats] = useState<ErrorLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [level, setLevel] = useState<ErrorLogLevel | "all">("all");
  const [resolvedFilter, setResolvedFilter] =
    useState<ResolvedFilter>("unresolved");
  const [reload, setReload] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fetchList = useCallback(() => {
    setLoading(true);
    return errorLogsService
      .list({
        page,
        limit: 15,
        level: level === "all" ? undefined : level,
        resolved:
          resolvedFilter === "all"
            ? undefined
            : resolvedFilter === "resolved",
        search: search || undefined,
      })
      .then(setData)
      .catch((e) => {
        toast.error(parseApiError(e).message);
        setData({
          data: [],
          meta: { page, limit: 15, total: 0, totalPages: 1 },
        });
      })
      .finally(() => setLoading(false));
  }, [page, level, resolvedFilter, search]);

  useEffect(() => {
    fetchList();
  }, [fetchList, reload]);

  useEffect(() => {
    errorLogsService
      .stats()
      .then(setStats)
      .catch(() => setStats(null));
  }, [reload]);

  // Debounce the search input.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const rows = useMemo<Row[]>(
    () => (data?.data ?? []).map(toRow),
    [data],
  );

  const columns = useMemo<Column<Row>[]>(
    () => [
      {
        key: "level",
        header: "سطح",
        width: "9rem",
        cell: (r) => {
          const meta = LEVEL_META[r.level];
          const Icon = meta.icon;
          return (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={meta.className}>
                <Icon className="ms-1 h-3 w-3" />
                {meta.label}
              </Badge>
              {r.statusCode ? (
                <span
                  className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums"
                  dir="ltr"
                >
                  {toPersianDigits(r.statusCode)}
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        key: "message",
        header: "پیام خطا",
        cell: (r) => (
          <div className="min-w-0 max-w-md">
            <p className="line-clamp-1 text-sm font-medium">{r.messageFa}</p>
            <p
              className="line-clamp-1 text-[11px] text-muted-foreground"
              dir="ltr"
              title={r.message}
            >
              {r.name ? <span className="me-1">{r.name}:</span> : null}
              {r.message}
            </p>
            {r.code ? (
              <code
                className="mt-0.5 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                dir="ltr"
              >
                {r.code}
              </code>
            ) : null}
          </div>
        ),
      },
      {
        key: "endpoint",
        header: "اندپوینت",
        cell: (r) =>
          r.url || r.path ? (
            <div className="min-w-0 max-w-[18rem]" dir="ltr">
              {r.method ? (
                <span
                  className={`me-1 text-[11px] font-semibold ${
                    METHOD_CLASS[r.method] ?? "text-muted-foreground"
                  }`}
                >
                  {r.method}
                </span>
              ) : null}
              <span
                className="truncate text-[11px] text-muted-foreground"
                title={r.url ?? r.path ?? undefined}
              >
                {r.url ?? r.path}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">{r.source}</span>
          ),
      },
      {
        key: "user",
        header: "کاربر",
        width: "10rem",
        cell: (r) =>
          r.user ? (
            <div className="text-xs">
              <p className="font-medium">
                {r.user.name || r.user.username || `#${r.user.id}`}
              </p>
              {r.ip ? (
                <p className="text-[10px] text-muted-foreground" dir="ltr">
                  {r.ip}
                </p>
              ) : null}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">مهمان</span>
          ),
      },
      {
        key: "createdAt",
        header: "زمان",
        width: "8rem",
        cell: (r) => (
          <span
            className="text-xs text-muted-foreground"
            title={formatDateTime(r.createdAt)}
          >
            {formatRelativeTime(r.createdAt)}
          </span>
        ),
      },
      {
        key: "resolved",
        header: "وضعیت",
        width: "7rem",
        cell: (r) =>
          r.resolved ? (
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            >
              <CheckCircle2 className="ms-1 h-3 w-3" />
              حل‌شده
            </Badge>
          ) : (
            <Badge variant="outline">باز</Badge>
          ),
      },
    ],
    [],
  );

  const refresh = () => setReload((x) => x + 1);

  return (
    <div className="space-y-4">
      <StatsRow stats={stats} loading={!stats && loading} />

      <DataTable<Row>
        data={rows}
        total={data?.meta.total}
        page={page}
        perPage={data?.meta.limit ?? 15}
        onPageChange={setPage}
        loading={loading}
        columns={columns}
        search={searchInput}
        onSearch={setSearchInput}
        searchPlaceholder="جستجو در پیام، آدرس یا کد خطا…"
        emptyTitle="خطایی ثبت نشده است"
        emptyDescription="اگر سرور با مشکلی مواجه شود، اطلاعات آن اینجا نمایش داده می‌شود."
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={level}
              onValueChange={(v) => {
                setLevel(v as ErrorLogLevel | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="سطح خطا" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه سطوح</SelectItem>
                <SelectItem value="critical">بحرانی</SelectItem>
                <SelectItem value="error">خطا</SelectItem>
                <SelectItem value="warn">هشدار</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={resolvedFilter}
              onValueChange={(v) => {
                setResolvedFilter(v as ResolvedFilter);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unresolved">باز</SelectItem>
                <SelectItem value="resolved">حل‌شده</SelectItem>
                <SelectItem value="all">همه</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              به‌روزرسانی
            </Button>
            <ConfirmDialog
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!stats || stats.total - stats.unresolved === 0}
                >
                  <Trash2 className="h-4 w-4" />
                  حذف موارد حل‌شده
                </Button>
              }
              title="حذف خطاهای حل‌شده"
              description="تمام خطاهایی که علامت «حل‌شده» خورده‌اند برای همیشه حذف می‌شوند."
              confirmLabel="حذف"
              destructive
              onConfirm={async () => {
                try {
                  const res = await errorLogsService.clearResolved();
                  toast.success(
                    `${toPersianDigits(res.removed)} مورد حذف شد`,
                  );
                  refresh();
                } catch (e) {
                  toast.error(parseApiError(e).message);
                }
              }}
            />
          </div>
        }
        rowActions={(r) => (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSelectedId(r._id)}
              aria-label="مشاهده جزئیات"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {r.resolved ? (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={async () => {
                  try {
                    await errorLogsService.unresolve(r._id);
                    toast.success("وضعیت حل‌شده برداشته شد");
                    refresh();
                  } catch (e) {
                    toast.error(parseApiError(e).message);
                  }
                }}
                aria-label="بازکردن مجدد"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={async () => {
                  try {
                    await errorLogsService.resolve(r._id);
                    toast.success("به‌عنوان حل‌شده علامت‌گذاری شد");
                    refresh();
                  } catch (e) {
                    toast.error(parseApiError(e).message);
                  }
                }}
                aria-label="علامت‌گذاری به‌عنوان حل‌شده"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
            <ConfirmDialog
              trigger={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="حذف"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
              title="حذف لاگ"
              description="این لاگ خطا برای همیشه حذف می‌شود."
              destructive
              onConfirm={async () => {
                try {
                  await errorLogsService.remove(r._id);
                  toast.success("حذف شد");
                  refresh();
                } catch (e) {
                  toast.error(parseApiError(e).message);
                }
              }}
            />
          </>
        )}
      />

      <ErrorLogDetailDialog
        id={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={refresh}
      />
    </div>
  );
}

function StatsRow({
  stats,
  loading,
}: {
  stats: ErrorLogStats | null;
  loading: boolean;
}) {
  const items = [
    { label: "همه خطاها", value: stats?.total ?? 0 },
    { label: "بدون رسیدگی", value: stats?.unresolved ?? 0, accent: "warn" },
    { label: "بحرانی", value: stats?.critical ?? 0, accent: "critical" },
    { label: "۲۴ ساعت اخیر", value: stats?.last24h ?? 0 },
  ] as const;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-xl border border-border bg-card p-4"
        >
          <p className="text-xs text-muted-foreground">{it.label}</p>
          <p
            className={`mt-1 text-2xl font-semibold tabular-nums ${
              "accent" in it && it.accent === "critical"
                ? "text-red-600 dark:text-red-400"
                : "accent" in it && it.accent === "warn"
                  ? "text-amber-600 dark:text-amber-400"
                  : ""
            }`}
          >
            {loading ? "…" : toPersianDigits(it.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
