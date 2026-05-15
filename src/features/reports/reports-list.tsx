"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EyeOff, MoreHorizontal, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { moderationService, reportsService } from "@/services/reports.service";
import { parseApiError } from "@/lib/api-error";
import { formatRelativeTime } from "@/lib/format";
import type { Paginated, Report, ReportStatus } from "@/types";

const targetLabel: Record<string, string> = {
  article: "مقاله",
  question: "سوال",
  answer: "پاسخ",
  comment: "نظر",
  user: "کاربر",
};

export function ReportsList() {
  const [data, setData] = useState<Paginated<Report> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ReportStatus | "all">("all");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    reportsService
      .list({
        page,
        limit: 10,
        status: status === "all" ? undefined : status,
      })
      .then((res) => active && setData(res))
      .catch(() =>
        active &&
        setData({ data: [], meta: { page, limit: 10, total: 0, totalPages: 1 } }),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, status, reload]);

  const columns = useMemo<Column<Report>[]>(
    () => [
      {
        key: "reason",
        header: "موضوع گزارش",
        cell: (r) => (
          <div>
            <p className="text-sm font-medium">{r.reason}</p>
            {r.description ? (
              <p className="line-clamp-1 text-[11px] text-muted-foreground">
                {r.description}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        key: "target",
        header: "هدف",
        cell: (r) => (
          <div>
            <Badge variant="outline">
              {targetLabel[r.targetType] ?? r.targetType}
            </Badge>
            <p className="mt-1 text-[10px] text-muted-foreground" dir="ltr">
              {r.targetId.slice(0, 8)}…
            </p>
          </div>
        ),
      },
      { key: "status", header: "وضعیت", cell: (r) => <StatusBadge status={r.status} /> },
      {
        key: "createdAt",
        header: "تاریخ",
        cell: (r) => (
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(r.createdAt)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable<Report>
      data={data?.data ?? []}
      total={data?.meta.total}
      page={page}
      perPage={data?.meta.limit ?? 10}
      onPageChange={setPage}
      loading={loading}
      columns={columns}
      filters={
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as ReportStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
            <SelectItem value="pending">در انتظار</SelectItem>
            <SelectItem value="reviewed">بررسی شده</SelectItem>
            <SelectItem value="resolved">حل شده</SelectItem>
            <SelectItem value="rejected">رد شده</SelectItem>
          </SelectContent>
        </Select>
      }
      rowActions={(r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={async () => {
                try {
                  await moderationService.hideReportTarget(r);
                  setReload((x) => x + 1);
                  toast.success("محتوا مخفی و گزارش بسته شد");
                } catch (e) {
                  toast.error(parseApiError(e).message);
                }
              }}
            >
              <EyeOff className="h-4 w-4" />
              مخفی‌سازی محتوا
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                try {
                  await moderationService.restoreReportTarget(r);
                  setReload((x) => x + 1);
                  toast.success("محتوا بازگردانده شد");
                } catch (e) {
                  toast.error(parseApiError(e).message);
                }
              }}
            >
              <ShieldCheck className="h-4 w-4" />
              بازگردانی
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                try {
                  await reportsService.review(r.id, "rejected");
                  setReload((x) => x + 1);
                  toast.success("گزارش رد شد");
                } catch (e) {
                  toast.error(parseApiError(e).message);
                }
              }}
            >
              <X className="h-4 w-4" />
              رد گزارش
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  );
}
