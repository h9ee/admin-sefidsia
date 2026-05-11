"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EyeOff, MoreHorizontal, ShieldCheck } from "lucide-react";
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
import { questionsService } from "@/services/questions.service";
import { parseApiError } from "@/lib/api-error";
import { formatRelativeTime } from "@/lib/format";
import type { Comment, Paginated } from "@/types";

const parentLabel: Record<string, string> = {
  article: "مقاله",
  question: "سوال",
  answer: "پاسخ",
};

export function CommentsList() {
  const [data, setData] = useState<Paginated<Comment> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    questionsService
      .listComments({ page, perPage: 10, search, status: status === "all" ? undefined : status })
      .then((res) => active && setData(res))
      .catch(() => active && setData({ data: [], meta: { total: 0, page, perPage: 10, totalPages: 1 } }))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, search, status, reload]);

  const columns = useMemo<Column<Comment>[]>(
    () => [
      {
        key: "comment",
        header: "نظر",
        cell: (c) => (
          <div className="space-y-1">
            <p className="line-clamp-2 text-sm">{c.body}</p>
            <p className="text-[11px] text-muted-foreground">
              {c.authorName ?? "ناشناس"}
            </p>
          </div>
        ),
      },
      {
        key: "parent",
        header: "روی",
        cell: (c) => <Badge variant="outline">{parentLabel[c.parentType] ?? c.parentType}</Badge>,
      },
      { key: "status", header: "وضعیت", cell: (c) => <StatusBadge status={c.status} /> },
      {
        key: "createdAt",
        header: "تاریخ",
        cell: (c) => <span className="text-xs text-muted-foreground">{formatRelativeTime(c.createdAt)}</span>,
      },
    ],
    [],
  );

  return (
    <DataTable<Comment>
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
      searchPlaceholder="جستجو در نظرات…"
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
      rowActions={(c) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {c.status !== "hidden" ? (
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await questionsService.setCommentStatus(c.id, "hidden");
                    setReload((x) => x + 1);
                    toast.success("نظر مخفی شد");
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
                    await questionsService.setCommentStatus(c.id, "visible");
                    setReload((x) => x + 1);
                    toast.success("نظر بازگردانده شد");
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
