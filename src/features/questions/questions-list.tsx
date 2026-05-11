"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, EyeOff, Flame, MoreHorizontal, ShieldCheck, ShieldOff, TrendingUp } from "lucide-react";
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
import { usePermission } from "@/hooks/use-permission";
import { questionsService } from "@/services/questions.service";
import { parseApiError } from "@/lib/api-error";
import { formatNumber, formatRelativeTime } from "@/lib/format";
import type { Paginated, Question } from "@/types";

export function QuestionsList() {
  const { can } = usePermission();
  const [data, setData] = useState<Paginated<Question> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    questionsService
      .list({ page, perPage: 10, search, status: status === "all" ? undefined : status })
      .then((res) => active && setData(res))
      .catch(() => active && setData({ data: [], meta: { total: 0, page, perPage: 10, totalPages: 1 } }))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, search, status, reload]);

  const columns = useMemo<Column<Question>[]>(
    () => [
      {
        key: "question",
        header: "سوال",
        cell: (q) => (
          <div className="flex items-start gap-2">
            {q.isDangerous ? <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-destructive" /> : null}
            <div className="min-w-0">
              <p className="line-clamp-1 text-sm font-medium">{q.title}</p>
              <p className="line-clamp-1 text-[11px] text-muted-foreground">{q.body}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {q.isAnonymous ? <Badge variant="outline">ناشناس</Badge> : null}
                {q.isTrending ? (
                  <Badge variant="secondary">
                    <TrendingUp className="h-3 w-3" />
                    پرطرفدار
                  </Badge>
                ) : null}
                {q.isHot ? (
                  <Badge variant="warning">
                    <Flame className="h-3 w-3" />
                    داغ
                  </Badge>
                ) : null}
                {q.tags.slice(0, 2).map((t) => (
                  <Badge key={t.id} variant="muted">
                    {t.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "author",
        header: "ثبت‌کننده",
        cell: (q) => (
          <span className="text-xs">
            {q.isAnonymous ? "ناشناس" : q.authorName ?? "—"}
          </span>
        ),
      },
      {
        key: "stats",
        header: "آمار",
        cell: (q) => (
          <div className="text-xs text-muted-foreground">
            {formatNumber(q.answersCount)} پاسخ · {formatNumber(q.views)} بازدید
          </div>
        ),
      },
      { key: "status", header: "وضعیت", cell: (q) => <StatusBadge status={q.status} /> },
      {
        key: "createdAt",
        header: "تاریخ",
        sortable: true,
        cell: (q) => <span className="text-xs text-muted-foreground">{formatRelativeTime(q.createdAt)}</span>,
      },
    ],
    [],
  );

  return (
    <DataTable<Question>
      data={data?.data ?? []}
      total={data?.meta.total}
      page={page}
      perPage={data?.meta.perPage ?? 10}
      onPageChange={setPage}
      search={search}
      onSearch={(q) => {
        setSearch(q);
        setPage(1);
      }}
      searchPlaceholder="جستجو در سوالات…"
      loading={loading}
      columns={columns}
      filters={
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
            <SelectItem value="open">باز</SelectItem>
            <SelectItem value="closed">بسته</SelectItem>
            <SelectItem value="review">نیازمند بازبینی</SelectItem>
            <SelectItem value="hidden">مخفی</SelectItem>
          </SelectContent>
        </Select>
      }
      rowActions={(q) =>
        can("questions.moderate") ? (
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
                    await questionsService.toggleDangerous(q.id, !q.isDangerous);
                    setReload((x) => x + 1);
                    toast.success(q.isDangerous ? "علامت محتوای خطرناک برداشته شد" : "محتوا به‌عنوان خطرناک علامت‌گذاری شد");
                  } catch (e) {
                    toast.error(parseApiError(e).message);
                  }
                }}
              >
                <AlertTriangle className="h-4 w-4" />
                {q.isDangerous ? "حذف هشدار خطرناک" : "علامت خطرناک"}
              </DropdownMenuItem>
              {q.status !== "hidden" ? (
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await questionsService.setStatus(q.id, "hidden");
                      setReload((x) => x + 1);
                      toast.success("سوال پنهان شد");
                    } catch (e) {
                      toast.error(parseApiError(e).message);
                    }
                  }}
                >
                  <EyeOff className="h-4 w-4" />
                  پنهان‌سازی
                </DropdownMenuItem>
              ) : null}
              {q.status === "hidden" ? (
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await questionsService.setStatus(q.id, "open");
                      setReload((x) => x + 1);
                      toast.success("سوال بازگردانده شد");
                    } catch (e) {
                      toast.error(parseApiError(e).message);
                    }
                  }}
                >
                  <ShieldCheck className="h-4 w-4" />
                  بازگردانی
                </DropdownMenuItem>
              ) : null}
              {q.status !== "closed" ? (
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await questionsService.setStatus(q.id, "closed");
                      setReload((x) => x + 1);
                      toast.success("سوال بسته شد");
                    } catch (e) {
                      toast.error(parseApiError(e).message);
                    }
                  }}
                >
                  <ShieldOff className="h-4 w-4" />
                  بستن سوال
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null
      }
    />
  );
}
