"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  EyeOff,
  MoreHorizontal,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePermission } from "@/hooks/use-permission";
import { questionsService } from "@/services/questions.service";
import { moderationService } from "@/services/reports.service";
import { parseApiError } from "@/lib/api-error";
import { formatNumber, formatRelativeTime } from "@/lib/format";
import { displayName } from "@/lib/user";
import type { Paginated, Question, QuestionStatus } from "@/types";

const warningLabel: Record<string, string> = {
  normal: "عادی",
  sensitive: "حساس",
  urgent: "ضروری",
};

export function QuestionsList() {
  const { can } = usePermission();
  const [data, setData] = useState<Paginated<Question> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<QuestionStatus | "all">("all");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    questionsService
      .list({
        page,
        limit: 10,
        q: search || undefined,
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
  }, [page, search, status, reload]);

  const columns = useMemo<Column<Question>[]>(
    () => [
      {
        key: "question",
        header: "سوال",
        cell: (q) => (
          <div className="flex items-start gap-2">
            {q.medicalWarningLevel === "urgent" ? (
              <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-destructive" />
            ) : null}
            <div className="min-w-0">
              <Link
                href={`/questions/${q.slug}`}
                className="line-clamp-1 text-sm font-medium hover:underline"
              >
                {q.title}
              </Link>
              <p className="line-clamp-1 text-[11px] text-muted-foreground">{q.body}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {q.isAnonymous ? <Badge variant="outline">ناشناس</Badge> : null}
                {q.medicalWarningLevel !== "normal" ? (
                  <Badge
                    variant={
                      q.medicalWarningLevel === "urgent" ? "destructive" : "warning"
                    }
                  >
                    {warningLabel[q.medicalWarningLevel]}
                  </Badge>
                ) : null}
                {q.tags?.slice(0, 2).map((t) => (
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
        // Admin always sees the real author; an "anonymous-to-public" chip is
        // added so it's obvious the byline is hidden on the live site.
        cell: (q) => (
          <div className="flex flex-col gap-0.5 text-xs">
            <span>{displayName(q.user)}</span>
            {q.isAnonymous ? (
              <Badge
                variant="outline"
                className="w-fit border-amber-500/40 bg-amber-500/5 text-[10px] text-amber-700 dark:text-amber-400"
              >
                ناشناس برای عموم
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        key: "stats",
        header: "آمار",
        cell: (q) => (
          <div className="text-xs text-muted-foreground">
            {formatNumber(q.answerCount)} پاسخ · {formatNumber(q.viewCount)} بازدید
          </div>
        ),
      },
      { key: "status", header: "وضعیت", cell: (q) => <StatusBadge status={q.status} /> },
      {
        key: "createdAt",
        header: "تاریخ",
        sortable: true,
        cell: (q) => (
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(q.createdAt)}
          </span>
        ),
      },
    ],
    [],
  );

  /** Run a moderation/destructive op on a batch of rows, sequentially so the
   *  backend isn't flooded. Errors don't abort the batch — they're collected
   *  and surfaced in a single toast at the end. */
  async function runBulk(
    selected: Question[],
    label: string,
    op: (q: Question) => Promise<unknown>,
  ) {
    let ok = 0;
    let fail = 0;
    for (const q of selected) {
      try {
        await op(q);
        ok += 1;
      } catch {
        fail += 1;
      }
    }
    if (ok > 0) toast.success(`${label}: ${ok} مورد`);
    if (fail > 0) toast.error(`${fail} مورد ناموفق بود`);
    setReload((x) => x + 1);
  }

  return (
    <DataTable<Question>
      data={data?.data ?? []}
      total={data?.meta.total}
      page={page}
      perPage={data?.meta.limit ?? 10}
      onPageChange={setPage}
      search={search}
      onSearch={(q) => {
        setSearch(q);
        setPage(1);
      }}
      searchPlaceholder="جستجو در سوالات…"
      loading={loading}
      columns={columns}
      selectable={can("moderation.manage") || can("questions.delete")}
      bulkActions={(selected) => (
        <>
          {can("moderation.manage") ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  runBulk(selected, "پنهان شد", (q) =>
                    moderationService.act({
                      targetType: "question",
                      targetId: q.id,
                      action: "hide",
                    }),
                  )
                }
              >
                <EyeOff className="h-4 w-4" />
                پنهان‌سازی همه
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  runBulk(selected, "بازگردانده شد", (q) =>
                    moderationService.act({
                      targetType: "question",
                      targetId: q.id,
                      action: "restore",
                    }),
                  )
                }
              >
                <ShieldCheck className="h-4 w-4" />
                بازگردانی همه
              </Button>
            </>
          ) : null}
          {can("questions.delete") ? (
            <ConfirmDialog
              title={`حذف ${selected.length} سؤال؟`}
              description="این عملیات قابل بازگشت نیست."
              destructive
              confirmLabel="حذف همه"
              onConfirm={() =>
                runBulk(selected, "حذف شد", (q) =>
                  questionsService.remove(q.id),
                )
              }
              trigger={
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  حذف همه
                </Button>
              }
            />
          ) : null}
        </>
      )}
      filters={
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as QuestionStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
            <SelectItem value="open">باز</SelectItem>
            <SelectItem value="answered">پاسخ داده شده</SelectItem>
            <SelectItem value="closed">بسته</SelectItem>
            <SelectItem value="duplicate">تکراری</SelectItem>
            <SelectItem value="hidden">مخفی</SelectItem>
          </SelectContent>
        </Select>
      }
      rowActions={(q) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {can("moderation.manage") ? (
              <>
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await moderationService.act({
                        targetType: "question",
                        targetId: q.id,
                        action: "hide",
                      });
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
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await moderationService.act({
                        targetType: "question",
                        targetId: q.id,
                        action: "restore",
                      });
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
              </>
            ) : null}
            {can("questions.delete") ? (
              <>
                <DropdownMenuSeparator />
                <ConfirmDialog
                  title="حذف سؤال"
                  description="این عملیات قابل بازگشت نیست."
                  destructive
                  confirmLabel="حذف"
                  onConfirm={async () => {
                    try {
                      await questionsService.remove(q.id);
                      setReload((x) => x + 1);
                      toast.success("سوال حذف شد");
                    } catch (e) {
                      toast.error(parseApiError(e).message);
                    }
                  }}
                  trigger={
                    <DropdownMenuItem destructive onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="h-4 w-4" />
                      حذف
                    </DropdownMenuItem>
                  }
                />
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  );
}
