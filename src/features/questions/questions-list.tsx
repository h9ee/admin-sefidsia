"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  Loader2,
  MoreHorizontal,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
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
import { DataTable, type Column, type Sort } from "@/components/tables/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DateRangePickerFa } from "@/components/forms/date-range-picker-fa";
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

/** Binary visibility filter mapped onto the underlying 5-state status enum.
 *  approved → admin wants to see anything that's currently visible to the
 *  public (NOT 'hidden'); the backend has no single value for "non-hidden"
 *  so we send no filter and post-filter is unnecessary because the table
 *  shows the per-row badge anyway. Unapproved → status === 'hidden'. */
type Approval = "all" | "approved" | "unapproved";

export function QuestionsList() {
  const { can } = usePermission();
  const [data, setData] = useState<Paginated<Question> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [approval, setApproval] = useState<Approval>("all");
  const [sort, setSort] = useState<Sort>({ key: "createdAt", dir: "desc" });
  const [dateRange, setDateRange] = useState<{
    from: string | null;
    to: string | null;
  }>({ from: null, to: null });
  const [reload, setReload] = useState(0);
  // Per-row in-flight indicator so the inline toggles can show a spinner
  // without re-rendering every other row.
  const [busyRow, setBusyRow] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    // Map the binary approval filter back onto the underlying enum:
    //  - "approved" cannot be expressed as a single backend value; the closest
    //    is "everything except hidden", which is also the public default. We
    //    keep `status` undefined and the rows themselves carry the badge.
    //  - "unapproved" maps cleanly to status=hidden.
    const statusFilter: QuestionStatus | undefined =
      approval === "unapproved" ? "hidden" : undefined;
    questionsService
      .list({
        page,
        limit: 10,
        q: search || undefined,
        status: statusFilter,
        dateFrom: dateRange.from ?? undefined,
        dateTo: dateRange.to ?? undefined,
        sortBy:
          (sort?.key as
            | "createdAt"
            | "voteScore"
            | "answerCount"
            | "viewCount"
            | undefined) ?? undefined,
        sortOrder: sort
          ? sort.dir === "asc"
            ? "ASC"
            : "DESC"
          : undefined,
      })
      .then((res) => {
        if (!active) return;
        // Client-side approved filter — backend can't express "everything
        // except hidden" as an enum value, so when the admin specifically
        // asked for "approved" we drop the hidden rows in the UI.
        if (approval === "approved") {
          res.data = res.data.filter((q) => q.status !== "hidden");
        }
        setData(res);
      })
      .catch(
        () =>
          active &&
          setData({
            data: [],
            meta: { page, limit: 10, total: 0, totalPages: 1 },
          }),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, search, approval, sort, dateRange, reload]);

  /** Toggle isAnonymous via questions.update. The list keeps the local row
   *  state in sync so the badge flips before the next refetch. */
  async function toggleAnonymous(q: Question) {
    setBusyRow(q.id);
    try {
      await questionsService.update(q.id, { isAnonymous: !q.isAnonymous });
      toast.success(
        !q.isAnonymous
          ? "نام ثبت‌کننده دیگر برای عموم نمایش داده نمی‌شود"
          : "نام ثبت‌کننده برای عموم نمایش داده می‌شود",
      );
      // Patch in-place (no full reload) — flips the badge immediately.
      setData((d) =>
        d
          ? {
              ...d,
              data: d.data.map((r) =>
                r.id === q.id ? { ...r, isAnonymous: !q.isAnonymous } : r,
              ),
            }
          : d,
      );
    } catch (e) {
      toast.error(parseApiError(e).message);
    } finally {
      setBusyRow(null);
    }
  }

  /** Toggle the binary approved/unapproved view via the moderation endpoint.
   *  Approved = anything not hidden (we use `restore`, which sets the row
   *  back to `active`/`open`); unapproved = `hide`. */
  async function toggleApproval(q: Question) {
    const goingToHide = q.status !== "hidden";
    setBusyRow(q.id);
    try {
      await moderationService.act({
        targetType: "question",
        targetId: q.id,
        action: goingToHide ? "hide" : "restore",
      });
      toast.success(goingToHide ? "سؤال پنهان شد" : "سؤال تأیید شد");
      setData((d) =>
        d
          ? {
              ...d,
              data: d.data.map((r) =>
                r.id === q.id
                  ? { ...r, status: goingToHide ? "hidden" : "open" }
                  : r,
              ),
            }
          : d,
      );
    } catch (e) {
      toast.error(parseApiError(e).message);
    } finally {
      setBusyRow(null);
    }
  }

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
              <p className="line-clamp-1 text-[11px] text-muted-foreground">
                {q.body}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {q.medicalWarningLevel !== "normal" ? (
                  <Badge
                    variant={
                      q.medicalWarningLevel === "urgent"
                        ? "destructive"
                        : "warning"
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
        // Admin always sees the real author; the inline button flips whether
        // that name is exposed publicly (the `isAnonymous` flag).
        cell: (q) => {
          const busy = busyRow === q.id;
          const anonymous = Boolean(q.isAnonymous);
          return (
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-medium">{displayName(q.user)}</span>
              {can("questions.update") ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={
                    "h-6 w-fit gap-1 text-[10px] " +
                    (anonymous
                      ? "border-amber-500/40 bg-amber-500/5 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
                      : "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400")
                  }
                  disabled={busy}
                  onClick={() => toggleAnonymous(q)}
                  title={
                    anonymous
                      ? "نام برای عموم پنهان است — کلیک برای نمایش"
                      : "نام برای عموم نمایش داده می‌شود — کلیک برای پنهان‌سازی"
                  }
                >
                  {busy ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : anonymous ? (
                    <UserX className="h-2.5 w-2.5" />
                  ) : (
                    <UserCheck className="h-2.5 w-2.5" />
                  )}
                  {anonymous ? "ناشناس برای عموم" : "نمایش نام"}
                </Button>
              ) : anonymous ? (
                <Badge
                  variant="outline"
                  className="w-fit border-amber-500/40 bg-amber-500/5 text-[10px] text-amber-700 dark:text-amber-400"
                >
                  ناشناس برای عموم
                </Badge>
              ) : null}
            </div>
          );
        },
      },
      {
        key: "answerCount",
        header: "آمار",
        sortable: true,
        cell: (q) => (
          <div className="text-xs text-muted-foreground">
            {formatNumber(q.answerCount)} پاسخ ·{" "}
            {formatNumber(q.viewCount)} بازدید
          </div>
        ),
      },
      {
        key: "status",
        header: "وضعیت",
        // Binary toggle: approved (anything not hidden) ↔ unapproved (hidden).
        cell: (q) => {
          const busy = busyRow === q.id;
          const approved = q.status !== "hidden";
          if (!can("moderation.manage")) {
            return (
              <Badge variant={approved ? "success" : "warning"}>
                {approved ? "تأیید" : "تأیید نشده"}
              </Badge>
            );
          }
          return (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={
                "h-7 gap-1 text-xs " +
                (approved
                  ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
                  : "border-amber-500/40 bg-amber-500/5 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400")
              }
              disabled={busy}
              onClick={() => toggleApproval(q)}
              title={approved ? "کلیک برای عدم تأیید" : "کلیک برای تأیید"}
            >
              {busy ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : approved ? (
                <Check className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3" />
              )}
              {approved ? "تأیید" : "تأیید نشده"}
            </Button>
          );
        },
      },
      {
        key: "voteScore",
        header: "امتیاز",
        sortable: true,
        cell: (q) => (
          <span className="text-xs text-muted-foreground">
            {formatNumber(q.voteScore)}
          </span>
        ),
      },
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
    [busyRow, can],
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
      sort={sort}
      onSortChange={(s) => {
        setSort(s);
        setPage(1);
      }}
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
                تأیید همه
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
        <>
          <Select
            value={approval}
            onValueChange={(v) => {
              setApproval(v as Approval);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="وضعیت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همهٔ وضعیت‌ها</SelectItem>
              <SelectItem value="approved">
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  تأیید
                </span>
              </SelectItem>
              <SelectItem value="unapproved">
                <span className="inline-flex items-center gap-1">
                  <EyeOff className="h-3 w-3" />
                  تأیید نشده
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <DateRangePickerFa
            value={dateRange}
            onChange={(v) => {
              setDateRange(v);
              setPage(1);
            }}
          />
        </>
      }
      rowActions={(q) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
                    <DropdownMenuItem
                      destructive
                      onSelect={(e) => e.preventDefault()}
                    >
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
