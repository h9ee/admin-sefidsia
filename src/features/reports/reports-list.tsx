"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, EyeOff, MoreHorizontal, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { reportsService } from "@/services/reports.service";
import { parseApiError } from "@/lib/api-error";
import { formatRelativeTime } from "@/lib/format";
import type { Paginated, Report } from "@/types";

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
  const [status, setStatus] = useState("all");
  const [target, setTarget] = useState("all");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    reportsService
      .list({
        page,
        perPage: 10,
        status: status === "all" ? undefined : status,
        targetType: target === "all" ? undefined : target,
      })
      .then((res) => active && setData(res))
      .catch(() => active && setData({ data: [], meta: { total: 0, page, perPage: 10, totalPages: 1 } }))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, status, target, reload]);

  const columns = useMemo<Column<Report>[]>(
    () => [
      {
        key: "reason",
        header: "موضوع گزارش",
        cell: (r) => (
          <div className="flex items-start gap-2">
            {r.isDangerous ? <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-destructive" /> : null}
            <div>
              <p className="text-sm font-medium">{r.reason}</p>
              {r.description ? (
                <p className="line-clamp-1 text-[11px] text-muted-foreground">{r.description}</p>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        key: "target",
        header: "هدف",
        cell: (r) => (
          <div>
            <Badge variant="outline">{targetLabel[r.targetType] ?? r.targetType}</Badge>
            {r.targetTitle ? (
              <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                {r.targetTitle}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        key: "reporter",
        header: "گزارش‌دهنده",
        cell: (r) => <span className="text-xs">{r.reporterName ?? "ناشناس"}</span>,
      },
      { key: "status", header: "وضعیت", cell: (r) => <StatusBadge status={r.status} /> },
      {
        key: "createdAt",
        header: "تاریخ",
        cell: (r) => <span className="text-xs text-muted-foreground">{formatRelativeTime(r.createdAt)}</span>,
      },
    ],
    [],
  );

  return (
    <DataTable<Report>
      data={data?.data ?? []}
      total={data?.meta.total}
      page={page}
      perPage={data?.meta.perPage ?? 10}
      onPageChange={setPage}
      loading={loading}
      columns={columns}
      selectable
      filters={
        <>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
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
              <SelectItem value="actioned">اقدام شده</SelectItem>
              <SelectItem value="dismissed">نادیده</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={target}
            onValueChange={(v) => {
              setTarget(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="نوع هدف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه</SelectItem>
              <SelectItem value="article">مقاله</SelectItem>
              <SelectItem value="question">سوال</SelectItem>
              <SelectItem value="answer">پاسخ</SelectItem>
              <SelectItem value="comment">نظر</SelectItem>
              <SelectItem value="user">کاربر</SelectItem>
            </SelectContent>
          </Select>
        </>
      }
      bulkActions={(rows) => (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                await reportsService.bulkAction({ ids: rows.map((r) => r.id), action: "hide" });
                setReload((x) => x + 1);
                toast.success(`${rows.length} مورد مخفی شد`);
              } catch (e) {
                toast.error(parseApiError(e).message);
              }
            }}
          >
            <EyeOff />
            مخفی‌سازی
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                await reportsService.bulkAction({ ids: rows.map((r) => r.id), action: "dismiss" });
                setReload((x) => x + 1);
                toast.success("نادیده گرفته شد");
              } catch (e) {
                toast.error(parseApiError(e).message);
              }
            }}
          >
            <X />
            نادیده گرفتن
          </Button>
        </>
      )}
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
                  await reportsService.hideTarget(r);
                  setReload((x) => x + 1);
                  toast.success("محتوا مخفی شد");
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
                  await reportsService.restoreTarget(r);
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
                  await reportsService.setStatus(r.id, "dismissed");
                  setReload((x) => x + 1);
                  toast.success("نادیده گرفته شد");
                } catch (e) {
                  toast.error(parseApiError(e).message);
                }
              }}
            >
              <X className="h-4 w-4" />
              نادیده گرفتن
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  );
}
