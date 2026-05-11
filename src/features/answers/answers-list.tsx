"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, EyeOff, MoreHorizontal, ShieldCheck, Stethoscope } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { questionsService } from "@/services/questions.service";
import { parseApiError } from "@/lib/api-error";
import { formatRelativeTime } from "@/lib/format";
import type { Answer, Paginated } from "@/types";

export function AnswersList() {
  const [data, setData] = useState<Paginated<Answer> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    questionsService
      .listAnswers({ page, perPage: 10, search, status: status === "all" ? undefined : status })
      .then((res) => active && setData(res))
      .catch(() => active && setData({ data: [], meta: { total: 0, page, perPage: 10, totalPages: 1 } }))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, search, status, reload]);

  const columns = useMemo<Column<Answer>[]>(
    () => [
      {
        key: "answer",
        header: "پاسخ",
        cell: (a) => (
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              {a.authorAvatar ? <AvatarImage src={a.authorAvatar} alt={a.authorName ?? ""} /> : null}
              <AvatarFallback>{a.authorName?.slice(0, 1) ?? "؟"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm">{a.body}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-muted-foreground">{a.authorName ?? "ناشناس"}</span>
                {a.isDoctor ? (
                  <Badge variant="secondary">
                    <Stethoscope className="h-3 w-3" />
                    پزشک
                  </Badge>
                ) : null}
                {a.isAccepted ? (
                  <Badge variant="success">
                    <CheckCircle2 className="h-3 w-3" />
                    پذیرفته شده
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "question",
        header: "سوال مرتبط",
        cell: (a) => (
          <span className="line-clamp-1 text-xs text-muted-foreground">
            {a.questionTitle ?? "—"}
          </span>
        ),
      },
      { key: "status", header: "وضعیت", cell: (a) => <StatusBadge status={a.status} /> },
      {
        key: "createdAt",
        header: "تاریخ",
        cell: (a) => <span className="text-xs text-muted-foreground">{formatRelativeTime(a.createdAt)}</span>,
      },
    ],
    [],
  );

  return (
    <DataTable<Answer>
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
      searchPlaceholder="جستجو در پاسخ‌ها…"
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
            <SelectItem value="visible">قابل نمایش</SelectItem>
            <SelectItem value="review">نیازمند بازبینی</SelectItem>
            <SelectItem value="hidden">مخفی</SelectItem>
          </SelectContent>
        </Select>
      }
      rowActions={(a) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {a.status !== "hidden" ? (
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await questionsService.setAnswerStatus(a.id, "hidden");
                    setReload((x) => x + 1);
                    toast.success("پاسخ مخفی شد");
                  } catch (e) {
                    toast.error(parseApiError(e).message);
                  }
                }}
              >
                <EyeOff className="h-4 w-4" />
                مخفی‌سازی
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await questionsService.setAnswerStatus(a.id, "visible");
                    setReload((x) => x + 1);
                    toast.success("پاسخ بازگردانده شد");
                  } catch (e) {
                    toast.error(parseApiError(e).message);
                  }
                }}
              >
                <ShieldCheck className="h-4 w-4" />
                بازگردانی
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  );
}
