"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  ExternalLink,
  Pencil,
  Search,
  ShieldCheck,
  Stethoscope,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PermissionGuard } from "@/components/permission/permission-guard";
import {
  answersService,
  questionsService,
  type AnswersQuery,
} from "@/services/questions.service";
import { moderationService } from "@/services/reports.service";
import { parseApiError } from "@/lib/api-error";
import { formatRelativeTime, toPersianDigits } from "@/lib/format";
import { displayName, userInitials } from "@/lib/user";
import { AnswerEditDialog } from "./answer-edit-dialog";
import { AnswersStats } from "./answers-stats";
import { ExportCsvButton } from "./export-csv-button";
import type { Answer, AnswerStatus, Paginated } from "@/types";

type StatusTab =
  | "all"
  | AnswerStatus
  | "doctor"
  | "accepted"
  | "reported";

const TABS: { value: StatusTab; label: string }[] = [
  { value: "all", label: "همه" },
  { value: "active", label: "فعال" },
  { value: "hidden", label: "پنهان" },
  { value: "reported", label: "گزارش‌شده" },
  { value: "doctor", label: "پاسخ پزشک" },
  { value: "accepted", label: "پذیرفته‌شده" },
];

const SORT_OPTIONS: {
  value: NonNullable<AnswersQuery["sortBy"]>;
  label: string;
}[] = [
  { value: "createdAt", label: "تازه‌ترین" },
  { value: "voteScore", label: "بیشترین امتیاز" },
  { value: "commentCount", label: "بیشترین کامنت" },
  { value: "openReportCount", label: "بیشترین گزارش" },
];

/**
 * Global moderation listing — calls `GET /api/answers`. Replaces the old
 * search-by-slug stub. Adds: report-count badge & tab, bulk select +
 * actions, accept-on-behalf for admins, sort by report count.
 */
export function AnswersInspector() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [tab, setTab] = useState<StatusTab>("all");
  const [sortBy, setSortBy] = useState<NonNullable<AnswersQuery["sortBy"]>>(
    "createdAt",
  );
  const [data, setData] = useState<Paginated<Answer> | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Answer | null>(null);
  // Bulk-selection state. Selection is intentionally scoped to the
  // current page — switching tab/sort/page clears it (avoids the
  // footgun of acting on answers the operator can no longer see).
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const filters: AnswersQuery = useMemo(() => {
    // Tabs map to mutually-exclusive backend filters. Keeping the mapping in
    // one place makes "add another tab" a one-line change.
    const tabFilters: AnswersQuery =
      tab === "active" || tab === "hidden"
        ? { status: tab }
        : tab === "doctor"
          ? { isDoctorAnswer: true }
          : tab === "accepted"
            ? { isAccepted: true }
            : tab === "reported"
              ? { hasOpenReports: true }
              : {};
    return {
      page,
      limit: 20,
      q: query || undefined,
      sortBy,
      sortOrder: "DESC",
      ...tabFilters,
    };
  }, [page, query, tab, sortBy]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await answersService.list(filters);
      setData(res);
      // Drop selection on every reload — answer IDs that no longer
      // appear in the list shouldn't survive in the bulk-action set.
      setSelected(new Set());
    } catch (e) {
      toast.error(parseApiError(e).message);
      setData({
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQuery(searchInput.trim());
  };

  const toggleOne = (id: string, on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const allChecked =
    data?.data.length && selected.size === data.data.length ? true : false;
  const someChecked = selected.size > 0 && !allChecked;
  const headerCheckedState: boolean | "indeterminate" = allChecked
    ? true
    : someChecked
      ? "indeterminate"
      : false;

  const toggleAll = (on: boolean) => {
    if (!data) return;
    setSelected(on ? new Set(data.data.map((a) => a.id)) : new Set());
  };

  /**
   * Run an action across every selected row. We deliberately run
   * sequentially to avoid hammering the API + keep moderation log entries
   * in a predictable order. The first failure surfaces a toast; remaining
   * rows still finish (so a single transient 500 doesn't abort the batch).
   */
  const runBulk = async (
    action: "hide" | "restore" | "delete",
  ): Promise<void> => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    const ids = Array.from(selected);
    let ok = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        if (action === "delete") {
          await answersService.remove(id);
        } else {
          await moderationService.act({
            targetType: "answer",
            targetId: id,
            action,
          });
        }
        ok++;
      } catch (e) {
        failed++;
        const msg = parseApiError(e).message;
        toast.error(`${msg} (شناسه ${id})`);
      }
    }
    setBulkBusy(false);
    if (ok > 0) {
      const verb =
        action === "delete"
          ? "حذف شد"
          : action === "hide"
            ? "پنهان شد"
            : "بازگردانده شد";
      toast.success(`${toPersianDigits(ok)} پاسخ ${verb}.`);
    }
    if (failed > 0) {
      toast.error(`${toPersianDigits(failed)} مورد ناموفق بود.`);
    }
    await load();
  };

  return (
    <div className="space-y-3">
      {/* Aggregate counters first — independent fetch so a slow stats query
          can't block the listing render. `query` is used as the refresh key
          so destructive batch actions trigger a re-fetch (selection is
          cleared on load, which bumps the dep). */}
      <AnswersStats refreshKey={`${tab}|${query}`} />

      <Card>
        <CardContent className="space-y-3 p-4">
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={handleSearch}
          >
            <div className="relative min-w-64 flex-1">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="جستجو در متن پاسخ…"
                className="pe-9"
              />
            </div>
            <Select
              value={sortBy}
              onValueChange={(v) => {
                setSortBy(v as NonNullable<AnswersQuery["sortBy"]>);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" disabled={loading}>
              جستجو
            </Button>
            <ExportCsvButton filters={filters} />
          </form>

          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as StatusTab);
              setPage(1);
            }}
          >
            <TabsList>
              {TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Bulk-actions header — only when at least one row exists. */}
      {data && data.data.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-xs">
          <label className="inline-flex items-center gap-2">
            <Checkbox
              checked={headerCheckedState}
              onCheckedChange={(v) => toggleAll(Boolean(v))}
              aria-label="انتخاب همه پاسخ‌ها"
            />
            <span className="text-muted-foreground">
              {selected.size > 0
                ? `${toPersianDigits(selected.size)} انتخاب‌شده`
                : "انتخاب همه"}
            </span>
          </label>
          {selected.size > 0 && (
            <PermissionGuard permission="moderation.manage">
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runBulk("hide")}
                  disabled={bulkBusy}
                >
                  <EyeOff className="h-3 w-3" />
                  پنهان‌سازی
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runBulk("restore")}
                  disabled={bulkBusy}
                >
                  <ShieldCheck className="h-3 w-3" />
                  بازگردانی
                </Button>
                <PermissionGuard permission="answers.delete">
                  <ConfirmDialog
                    title={`حذف ${toPersianDigits(selected.size)} پاسخ`}
                    description="پس از حذف امکان بازگشت وجود ندارد."
                    destructive
                    confirmLabel="حذف همه"
                    onConfirm={() => runBulk("delete")}
                    trigger={
                      <Button size="sm" variant="outline" disabled={bulkBusy}>
                        <Trash2 className="h-3 w-3" />
                        حذف
                      </Button>
                    }
                  />
                </PermissionGuard>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelected(new Set())}
                  disabled={bulkBusy}
                  aria-label="لغو انتخاب"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </PermissionGuard>
          )}
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <ListSkeleton />
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            title="پاسخی یافت نشد"
            description={
              query
                ? "نتیجه‌ای برای این جستجو نبود — فیلتر/کلمات کلیدی را تغییر دهید."
                : "هیچ پاسخی مطابق فیلترهای فعلی وجود ندارد."
            }
          />
        ) : (
          data.data.map((a: Answer) => (
            <AnswerRow
              key={a.id}
              answer={a}
              selected={selected.has(a.id)}
              onToggle={(on) => toggleOne(a.id, on)}
              onEdit={() => setEditing(a)}
              onReload={load}
            />
          ))
        )}

        {data && data.meta.totalPages > 1 && (
          <Pager
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            onChange={setPage}
          />
        )}
      </div>

      <AnswerEditDialog
        answer={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          void load();
        }}
      />
    </div>
  );
}

/* ----------------------------- single row ----------------------------- */

function AnswerRow({
  answer,
  selected,
  onToggle,
  onEdit,
  onReload,
}: {
  answer: Answer;
  selected: boolean;
  onToggle: (on: boolean) => void;
  onEdit: () => void;
  onReload: () => Promise<void> | void;
}) {
  const isEdited =
    answer.updatedAt && answer.updatedAt !== answer.createdAt;
  const reports = Number(answer.openReportCount ?? 0);

  return (
    <Card className={selected ? "ring-1 ring-primary" : undefined}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <PermissionGuard permission="moderation.manage">
              <Checkbox
                checked={selected}
                onCheckedChange={(v) => onToggle(Boolean(v))}
                aria-label="انتخاب این پاسخ"
                className="mt-1"
              />
            </PermissionGuard>
            <Avatar className="h-7 w-7">
              {answer.author?.avatar ? (
                <AvatarImage
                  src={answer.author.avatar}
                  alt={displayName(answer.author)}
                />
              ) : null}
              <AvatarFallback>{userInitials(answer.author)}</AvatarFallback>
            </Avatar>
            <div className="text-xs">
              <span className="font-medium">{displayName(answer.author)}</span>
              <span className="ms-1 text-muted-foreground">
                · {formatRelativeTime(answer.createdAt)}
                {isEdited ? ` · ویرایش‌شده ${formatRelativeTime(answer.updatedAt!)}` : ""}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {reports > 0 ? (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3" />
                {toPersianDigits(reports)} گزارش
              </Badge>
            ) : null}
            {answer.isDoctorAnswer ? (
              <Badge variant="secondary">
                <Stethoscope className="h-3 w-3" />
                پزشک
              </Badge>
            ) : null}
            {answer.isAccepted ? (
              <Badge variant="success">
                <CheckCircle2 className="h-3 w-3" />
                پذیرفته‌شده
              </Badge>
            ) : null}
            <StatusBadge status={answer.status} />
            <span className="ms-1 text-[11px] text-muted-foreground tabular-nums">
              امتیاز {toPersianDigits(answer.voteScore)}
            </span>
          </div>
        </div>

        {answer.question ? (
          <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-xs">
            <span className="shrink-0 text-muted-foreground">سؤال:</span>
            <Link
              href={`/questions/${answer.question.id}`}
              className="flex-1 truncate font-medium hover:underline"
            >
              {answer.question.title}
            </Link>
            <a
              href={`/questions/${answer.question.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
              aria-label="باز کردن سؤال در پنجره جدید"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        ) : null}

        {/* Backend stores answer body as HTML (sanitised on write). Render
            with dangerouslySetInnerHTML so tags don't appear as text. */}
        <div
          className="prose prose-sm max-w-none rtl:prose-headings:text-right text-sm leading-7"
          dangerouslySetInnerHTML={{ __html: answer.body }}
        />

        <PermissionGuard permission="moderation.manage">
          <div className="flex flex-wrap gap-1 border-t border-border pt-2">
            <PermissionGuard permission="answers.update">
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Pencil className="h-3 w-3" />
                ویرایش
              </Button>
            </PermissionGuard>
            {/* Accept-on-behalf — backend `acceptAnswer` already lets
                admin/developer bypass the "must be the asker" check, so
                this just calls the existing endpoint and reloads. Hidden
                when there's no parent question on the row payload. */}
            {answer.question && !answer.isAccepted ? (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await questionsService.acceptAnswer(
                      answer.question!.id,
                      answer.id,
                    );
                    await onReload();
                    toast.success("پاسخ به‌عنوان پذیرفته‌شده ثبت شد");
                  } catch (e) {
                    toast.error(parseApiError(e).message);
                  }
                }}
              >
                <ThumbsUp className="h-3 w-3" />
                پذیرفتن
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  await moderationService.act({
                    targetType: "answer",
                    targetId: answer.id,
                    action: "hide",
                  });
                  await onReload();
                  toast.success("پاسخ پنهان شد");
                } catch (e) {
                  toast.error(parseApiError(e).message);
                }
              }}
            >
              <EyeOff className="h-3 w-3" />
              پنهان‌سازی
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  await moderationService.act({
                    targetType: "answer",
                    targetId: answer.id,
                    action: "restore",
                  });
                  await onReload();
                  toast.success("پاسخ بازگردانده شد");
                } catch (e) {
                  toast.error(parseApiError(e).message);
                }
              }}
            >
              <ShieldCheck className="h-3 w-3" />
              بازگردانی
            </Button>
            <PermissionGuard permission="answers.delete">
              <ConfirmDialog
                title="حذف پاسخ"
                destructive
                confirmLabel="حذف"
                onConfirm={async () => {
                  try {
                    await answersService.remove(answer.id);
                    await onReload();
                    toast.success("پاسخ حذف شد");
                  } catch (e) {
                    toast.error(parseApiError(e).message);
                  }
                }}
                trigger={
                  <Button size="sm" variant="outline">
                    <Trash2 className="h-3 w-3" />
                    حذف
                  </Button>
                }
              />
            </PermissionGuard>
          </div>
        </PermissionGuard>
      </CardContent>
    </Card>
  );
}

/* ----------------------------- pager ----------------------------- */

function Pager({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-xs">
      <span className="text-muted-foreground">
        مجموع {toPersianDigits(total)} پاسخ
      </span>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronRight className="h-3.5 w-3.5" />
          قبلی
        </Button>
        <span className="tabular-nums">
          صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          بعدی
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
