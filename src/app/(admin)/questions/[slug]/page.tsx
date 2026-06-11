"use client";

import * as React from "react";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  AtSign,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Edit3,
  EyeOff,
  EyeIcon,
  Flag,
  History,
  ImagePlus,
  Link2,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Save,
  Sparkles,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UserIcon,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { AnswerComposer } from "@/features/answers/answer-composer";
import {
  questionsService,
  answersService,
  commentsService,
} from "@/services/questions.service";
import { moderationService, reportsService } from "@/services/reports.service";
import { tagsService } from "@/services/tags.service";
import { parseApiError } from "@/lib/api-error";
import { formatRelativeTime, formatNumber, formatDate } from "@/lib/format";
import { displayName, userInitials } from "@/lib/user";
import { mediaService } from "@/services/media.service";
import { mediaUrl } from "@/lib/media-url";
import { usePermission } from "@/hooks/use-permission";
import type {
  Answer,
  Comment,
  CommentStatus,
  MedicalWarningLevel,
  ModerationLog,
  Question,
  QuestionStatus,
  Report,
  ReportStatus,
  Tag,
  User,
} from "@/types";

const warningLabel: Record<MedicalWarningLevel, string> = {
  normal: "عادی",
  sensitive: "حساس",
  urgent: "ضروری",
};

const statusLabel: Record<QuestionStatus, string> = {
  open: "باز",
  answered: "پاسخ داده شده",
  closed: "بسته",
  duplicate: "تکراری",
  hidden: "مخفی",
};

const roleLabel: Record<string, string> = {
  user: "کاربر",
  doctor: "پزشک",
  admin: "ادمین",
  normal: "کاربر",
};

export default function QuestionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { can } = usePermission();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  // Inline question-edit state (admin can fix typos / clarify wording).
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editAnonymous, setEditAnonymous] = useState(false);
  // Independent (single-field) save indicators for the dropdowns.
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingWarning, setSavingWarning] = useState(false);
  const [savingTags, setSavingTags] = useState(false);

  const load = () => {
    setLoading(true);
    questionsService
      .getBySlug(slug)
      .then(async (q) => {
        setQuestion(q);
        const list = await answersService.listForQuestion(q.id).catch(() => []);
        setAnswers(list);
      })
      .catch((e) => toast.error(parseApiError(e).message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [slug]);

  /* ------------------ single-field patch helpers (dropdowns) ----------------- */

  async function patchField(
    patch: Partial<{
      status: QuestionStatus;
      medicalWarningLevel: MedicalWarningLevel;
      tagIds: string[];
    }>,
    onLoading: (v: boolean) => void,
    successMsg: string,
  ) {
    if (!question) return;
    onLoading(true);
    try {
      const updated = await questionsService.update(question.id, patch);
      // The PATCH response is the bare updated row WITHOUT eager-loaded
      // associations (user, tags) — keep the in-memory `user`/`tags` and just
      // merge the scalar fields we care about.
      setQuestion((prev) =>
        prev
          ? {
              ...prev,
              status: updated.status,
              medicalWarningLevel: updated.medicalWarningLevel,
              isAnonymous: updated.isAnonymous,
            }
          : prev,
      );
      toast.success(successMsg);
      // For tag changes the in-memory `tags` is stale — refetch for accuracy.
      if (patch.tagIds !== undefined) load();
    } catch (e) {
      toast.error(parseApiError(e).message);
    } finally {
      onLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="جزئیات سوال"
        actions={
          <Button variant="outline" asChild>
            <Link href="/questions">
              <ArrowRight />
              بازگشت
            </Link>
          </Button>
        }
      />

      {loading || !question ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* ────────────────────────── Main column ────────────────────────── */}
          <div className="space-y-4 lg:col-span-2 min-w-0">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    {editingQuestion ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="عنوان سؤال"
                        autoFocus
                        className="text-base font-semibold"
                      />
                    ) : (
                      <CardTitle>{question.title}</CardTitle>
                    )}
                    {/* Admin meta line — ALWAYS shows the real author (never
                        masks them to staff) and tags an "anonymous to public"
                        chip so it's obvious the byline is hidden on the live
                        site. */}
                    <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span>
                        ثبت‌کننده: {displayName(question.user)}
                      </span>
                      {question.isAnonymous && (
                        <Badge
                          variant="outline"
                          className="border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400"
                        >
                          <EyeOff className="h-3 w-3" />
                          ناشناس برای عموم
                        </Badge>
                      )}
                      <span aria-hidden>·</span>
                      <span>{formatRelativeTime(question.createdAt)}</span>
                    </p>
                    {question.editedByTeam ? (
                      <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Sparkles className="h-3 w-3" />
                        ویرایش شده توسط تیم
                        {question.editedByTeamAt
                          ? ` · ${formatRelativeTime(question.editedByTeamAt)}`
                          : ""}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-start gap-1">
                    <StatusBadge status={question.status} />
                    {question.medicalWarningLevel !== "normal" ? (
                      <Badge
                        variant={
                          question.medicalWarningLevel === "urgent"
                            ? "destructive"
                            : "warning"
                        }
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {warningLabel[question.medicalWarningLevel]}
                      </Badge>
                    ) : null}
                    {!editingQuestion ? (
                      <PermissionGuard permission="questions.update">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditTitle(question.title);
                            setEditBody(question.body);
                            setEditAnonymous(question.isAnonymous);
                            setEditingQuestion(true);
                          }}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          ویرایش
                        </Button>
                      </PermissionGuard>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {editingQuestion ? (
                  <div className="space-y-3 rounded-md border border-border bg-muted/40 p-3">
                    <Textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={6}
                      placeholder="شرح کامل سؤال"
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editAnonymous}
                        onChange={(e) => setEditAnonymous(e.target.checked)}
                        className="size-4 rounded border-border"
                      />
                      نمایش به‌صورت ناشناس (نام کاربر برای عموم مخفی می‌شود)
                    </label>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingQuestion(false)}
                        disabled={savingQuestion}
                      >
                        <X className="h-3.5 w-3.5" />
                        انصراف
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={
                          savingQuestion ||
                          editTitle.trim().length < 10 ||
                          editBody.trim().length < 20
                        }
                        onClick={async () => {
                          setSavingQuestion(true);
                          try {
                            await questionsService.update(question.id, {
                              title: editTitle.trim(),
                              body: editBody.trim(),
                              isAnonymous: editAnonymous,
                            });
                            toast.success("سؤال به‌روزرسانی شد");
                            setEditingQuestion(false);
                            load();
                          } catch (e) {
                            toast.error(parseApiError(e).message);
                          } finally {
                            setSavingQuestion(false);
                          }
                        }}
                      >
                        {savingQuestion ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        ذخیره ویرایش
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="leading-7 whitespace-pre-wrap">{question.body}</p>
                )}

                {/* Tags editor (inline chip picker). */}
                <TagsEditor
                  tags={question.tags ?? []}
                  saving={savingTags}
                  editable={can("questions.update")}
                  onChange={(tagIds) =>
                    patchField(
                      { tagIds },
                      setSavingTags,
                      "برچسب‌ها به‌روز شدند",
                    )
                  }
                />

                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>{formatNumber(question.viewCount)} بازدید</span>
                  <span>{formatNumber(question.answerCount)} پاسخ</span>
                  <span>{formatNumber(question.voteScore)} رای</span>
                </div>

                {/* Workflow controls (status + warning level + moderation). */}
                <PermissionGuard permission="questions.update">
                  <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        وضعیت سؤال
                      </p>
                      <Select
                        value={question.status}
                        disabled={savingStatus}
                        onValueChange={(v) =>
                          patchField(
                            { status: v as QuestionStatus },
                            setSavingStatus,
                            "وضعیت سؤال به‌روز شد",
                          )
                        }
                      >
                        <SelectTrigger>
                          {savingStatus ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : null}
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            [
                              "open",
                              "answered",
                              "closed",
                              "duplicate",
                              "hidden",
                            ] as QuestionStatus[]
                          ).map((s) => (
                            <SelectItem key={s} value={s}>
                              {statusLabel[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        سطح هشدار پزشکی
                      </p>
                      <Select
                        value={question.medicalWarningLevel}
                        disabled={savingWarning}
                        onValueChange={(v) =>
                          patchField(
                            { medicalWarningLevel: v as MedicalWarningLevel },
                            setSavingWarning,
                            "سطح هشدار به‌روز شد",
                          )
                        }
                      >
                        <SelectTrigger>
                          {savingWarning ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : null}
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            ["normal", "sensitive", "urgent"] as MedicalWarningLevel[]
                          ).map((w) => (
                            <SelectItem key={w} value={w}>
                              {warningLabel[w]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {question.status === "duplicate" ? (
                    <DuplicateLinkEditor
                      questionId={question.id}
                      duplicateOfId={question.duplicateOfQuestionId ?? null}
                      onSaved={load}
                    />
                  ) : null}
                </PermissionGuard>

                <PermissionGuard permission="moderation.manage">
                  <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await moderationService.act({
                            targetType: "question",
                            targetId: question.id,
                            action: "hide",
                          });
                          load();
                          toast.success("سوال پنهان شد");
                        } catch (e) {
                          toast.error(parseApiError(e).message);
                        }
                      }}
                    >
                      <EyeOff />
                      پنهان‌سازی
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await moderationService.act({
                            targetType: "question",
                            targetId: question.id,
                            action: "restore",
                          });
                          load();
                          toast.success("سوال بازگردانده شد");
                        } catch (e) {
                          toast.error(parseApiError(e).message);
                        }
                      }}
                    >
                      <ShieldCheck />
                      بازگردانی
                    </Button>
                  </div>
                </PermissionGuard>
              </CardContent>
            </Card>

            {/* SEO metadata editor — seoTitle / seoDescription / ogImage. */}
            <PermissionGuard permission="questions.update">
              <SeoPanel question={question} onSaved={load} />
            </PermissionGuard>

            {/* Reports filed against this question — read for any role with
                `reports.manage`; review actions need `moderation.manage`. */}
            <PermissionGuard permission="reports.manage">
              <ReportsPanel targetType="question" targetId={question.id} />
            </PermissionGuard>

            {/* Comments written under the question (NOT the answers — those
                have their own collapsible thread inside each AnswerRow). */}
            <CommentsPanel targetType="question" targetId={question.id} />

            {/* Audit history — moderation actions taken on THIS question.
                Surfaces who hid/restored/deleted it and when. */}
            <PermissionGuard permission="moderation.manage">
              <AuditLogPanel targetType="question" targetId={question.id} />
            </PermissionGuard>

            {/* Admin/doctor answer composer */}
            <AnswerComposer
              questionId={question.id}
              onCreated={(a) => {
                setAnswers((prev) => [a, ...prev]);
                setQuestion((q) =>
                  q ? { ...q, answerCount: (q.answerCount ?? 0) + 1 } : q,
                );
              }}
            />

            <Card>
              <CardHeader>
                <CardTitle>پاسخ‌ها ({formatNumber(answers.length)})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {answers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    پاسخی ثبت نشده است.
                  </p>
                ) : (
                  answers.map((a) => (
                    <AnswerRow
                      key={a.id}
                      answer={a}
                      questionId={question.id}
                      acceptedAnswerId={question.acceptedAnswerId ?? null}
                      onChanged={load}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* ────────────────────────── Side column ────────────────────────── */}
          <div className="space-y-4">
            <UserPanel user={question.user} />
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------------------------------------------------------------------- */
/*  Sidebar: User info panel (admin sees full author details regardless of      */
/*  anonymous flag).                                                            */
/* ---------------------------------------------------------------------------- */

function UserPanel({ user }: { user: User | undefined }) {
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <UserIcon className="h-4 w-4" />
            اطلاعات کاربر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            اطلاعات ثبت‌کننده در پاسخ بک‌اند نیست.
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <UserIcon className="h-4 w-4" />
          اطلاعات کاربر
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            {user.avatar ? (
              <AvatarImage src={mediaUrl(user.avatar)} alt={displayName(user)} />
            ) : null}
            <AvatarFallback>{userInitials(user)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{displayName(user)}</p>
            <p className="truncate text-xs text-muted-foreground" dir="ltr">
              @{user.username}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <UserRow icon={<AtSign className="h-3 w-3" />} label="نقش">
            <Badge variant="outline">
              {roleLabel[user.userType] ?? user.userType}
            </Badge>
            {user.isVerified ? (
              <Badge variant="success" className="ms-1">
                تأیید شده
              </Badge>
            ) : null}
          </UserRow>
          {user.mobile ? (
            <UserRow icon={<Phone className="h-3 w-3" />} label="موبایل">
              <span dir="ltr">{user.mobile}</span>
            </UserRow>
          ) : null}
          {user.email ? (
            <UserRow icon={<Mail className="h-3 w-3" />} label="ایمیل">
              <span dir="ltr" className="break-all">
                {user.email}
              </span>
            </UserRow>
          ) : null}
          <UserRow icon={<TrendingUp className="h-3 w-3" />} label="امتیاز">
            {formatNumber(user.xp)} XP · سطح {formatNumber(user.level)}
          </UserRow>
          <UserRow icon={<EyeIcon className="h-3 w-3" />} label="شهرت">
            {formatNumber(user.reputation)}
          </UserRow>
          <UserRow icon={<CalendarClock className="h-3 w-3" />} label="ثبت‌نام">
            {formatDate(user.createdAt)}
          </UserRow>
          {user.lastLoginAt ? (
            <UserRow icon={<CalendarClock className="h-3 w-3" />} label="آخرین ورود">
              {formatRelativeTime(user.lastLoginAt)}
            </UserRow>
          ) : null}
        </div>

        {user.bio ? (
          <p className="rounded-md bg-muted/40 p-2 text-xs leading-6 text-muted-foreground">
            {user.bio}
          </p>
        ) : null}

        <PermissionGuard permission="users.read">
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link href={`/users/${user.id}`}>مشاهدهٔ پروفایل کامل</Link>
          </Button>
        </PermissionGuard>
      </CardContent>
    </Card>
  );
}

function UserRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span className="w-16 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}

/* ---------------------------------------------------------------------------- */
/*  Tags editor — inline chip list with autocomplete.                           */
/* ---------------------------------------------------------------------------- */

function TagsEditor({
  tags,
  editable,
  saving,
  onChange,
}: {
  tags: Tag[];
  editable: boolean;
  saving: boolean;
  onChange: (ids: string[]) => void;
}) {
  const [adding, setAdding] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<Tag[]>([]);
  const [searchBusy, setSearchBusy] = React.useState(false);

  // Debounced lookup (kept simple — admin searches are infrequent).
  React.useEffect(() => {
    if (!adding) return;
    const term = query.trim();
    if (term.length < 1) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearchBusy(true);
      try {
        const res = await tagsService.list({ q: term, limit: 10 });
        // Hide tags already attached to the question.
        const attached = new Set(tags.map((t) => String(t.id)));
        setSuggestions(
          (res.data ?? []).filter((t) => !attached.has(String(t.id))),
        );
      } catch {
        setSuggestions([]);
      } finally {
        setSearchBusy(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, adding, tags]);

  function attachTag(tag: Tag) {
    const ids = Array.from(
      new Set([...tags.map((t) => String(t.id)), String(tag.id)]),
    );
    onChange(ids);
    setQuery("");
    setAdding(false);
  }

  function detachTag(id: string) {
    const ids = tags.map((t) => String(t.id)).filter((x) => x !== id);
    onChange(ids);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">برچسب‌ها</p>
        {editable && !adding ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAdding(true)}
            disabled={saving}
          >
            <Plus className="h-3 w-3" />
            افزودن
          </Button>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.length === 0 ? (
          <span className="text-xs text-muted-foreground">
            هنوز برچسبی ندارد.
          </span>
        ) : (
          tags.map((t) => (
            <Badge
              key={t.id}
              variant="outline"
              className="inline-flex items-center gap-1"
            >
              {t.name}
              {editable ? (
                <button
                  type="button"
                  aria-label={`حذف ${t.name}`}
                  className="ms-0.5 rounded p-0.5 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => detachTag(String(t.id))}
                  disabled={saving}
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </Badge>
          ))
        )}
        {saving ? (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        ) : null}
      </div>
      {adding ? (
        <div className="rounded-md border border-border bg-card p-2">
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              placeholder="جستجوی برچسب…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setAdding(false);
                setQuery("");
                setSuggestions([]);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          {searchBusy ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              در حال جستجو…
            </p>
          ) : suggestions.length === 0 && query.trim().length > 0 ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              برچسبی مطابق یافت نشد.
            </p>
          ) : (
            <ul className="mt-2 flex max-h-40 flex-wrap gap-1 overflow-auto">
              {suggestions.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs hover:bg-accent"
                    onClick={() => attachTag(t)}
                  >
                    {t.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------------------- */
/*  Per-answer row (unchanged from the previous revision).                      */
/* ---------------------------------------------------------------------------- */

function AnswerRow({
  answer,
  questionId,
  acceptedAnswerId,
  onChanged,
}: {
  answer: Answer;
  questionId: string;
  acceptedAnswerId: string | null;
  onChanged: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [body, setBody] = React.useState(answer.body);
  const [busy, setBusy] = React.useState<null | "save" | "accept" | "delete">(
    null,
  );
  const isAccepted = answer.isAccepted || acceptedAnswerId === answer.id;

  async function save() {
    if (body.trim().length < 30) {
      toast.error("پاسخ باید حداقل ۳۰ کاراکتر باشد.");
      return;
    }
    setBusy("save");
    try {
      await answersService.update(answer.id, { body: body.trim() });
      toast.success("پاسخ به‌روز شد");
      setEditing(false);
      onChanged();
    } catch (e) {
      toast.error(parseApiError(e).message);
    } finally {
      setBusy(null);
    }
  }

  async function accept() {
    setBusy("accept");
    try {
      await questionsService.acceptAnswer(questionId, answer.id);
      toast.success("پاسخ به‌عنوان پاسخ صحیح علامت‌گذاری شد");
      onChanged();
    } catch (e) {
      toast.error(parseApiError(e).message);
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm("این پاسخ حذف شود؟")) return;
    setBusy("delete");
    try {
      await answersService.remove(answer.id);
      toast.success("پاسخ حذف شد");
      onChanged();
    } catch (e) {
      toast.error(parseApiError(e).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className={
        "rounded-lg border p-3 transition-colors " +
        (isAccepted
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-border hover:bg-muted/30")
      }
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            {answer.author?.avatar ? (
              <AvatarImage
                src={mediaUrl(answer.author.avatar)}
                alt={displayName(answer.author)}
              />
            ) : null}
            <AvatarFallback>{userInitials(answer.author)}</AvatarFallback>
          </Avatar>
          <div className="text-xs">
            <span className="font-medium">{displayName(answer.author)}</span>
            <span className="ms-1 text-muted-foreground">
              · {formatRelativeTime(answer.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {answer.isDoctorAnswer ? <Badge variant="secondary">پزشک</Badge> : null}
          {isAccepted ? <Badge variant="success">پذیرفته شده</Badge> : null}
          <StatusBadge status={answer.status} />
        </div>
      </div>

      {editing ? (
        <div className="mt-2 space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            disabled={busy === "save"}
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={busy === "save"}
              onClick={() => {
                setEditing(false);
                setBody(answer.body);
              }}
            >
              <X className="h-3 w-3" />
              انصراف
            </Button>
            <Button
              size="sm"
              disabled={busy === "save" || body.trim().length < 30}
              onClick={save}
            >
              {busy === "save" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : null}
              ذخیره
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm leading-7 whitespace-pre-wrap">
          {answer.body}
        </p>
      )}

      {!editing && (
        <div className="mt-2 flex flex-wrap gap-1">
          <PermissionGuard permission="answers.update">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
              disabled={busy !== null}
            >
              <Edit3 className="h-3 w-3" />
              ویرایش
            </Button>
          </PermissionGuard>

          {!isAccepted && (
            <Button
              size="sm"
              variant="outline"
              onClick={accept}
              disabled={busy !== null}
            >
              {busy === "accept" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              علامت‌گذاری به‌عنوان پاسخ صحیح
            </Button>
          )}

          <PermissionGuard permission="moderation.manage">
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={async () => {
                try {
                  await moderationService.act({
                    targetType: "answer",
                    targetId: answer.id,
                    action: "hide",
                  });
                  onChanged();
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
              disabled={busy !== null}
              onClick={async () => {
                try {
                  await moderationService.act({
                    targetType: "answer",
                    targetId: answer.id,
                    action: "restore",
                  });
                  onChanged();
                  toast.success("پاسخ بازگردانده شد");
                } catch (e) {
                  toast.error(parseApiError(e).message);
                }
              }}
            >
              <ShieldCheck className="h-3 w-3" />
              بازگردانی
            </Button>
          </PermissionGuard>

          <PermissionGuard permission="answers.delete">
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={remove}
              disabled={busy !== null}
            >
              {busy === "delete" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              حذف
            </Button>
          </PermissionGuard>
        </div>
      )}

      {/* Lazy-loaded comments thread for this specific answer. */}
      <AnswerCommentsToggle answerId={answer.id} />
    </div>
  );
}

/* ---------------------------------------------------------------------------- */
/*  Reports panel — surfaces user reports filed against this target.            */
/* ---------------------------------------------------------------------------- */

const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  pending: "در انتظار",
  reviewed: "بررسی شده",
  rejected: "رد شده",
  resolved: "حل شده",
};

function ReportsPanel({
  targetType,
  targetId,
}: {
  targetType: "question" | "answer";
  targetId: string;
}) {
  const { can } = usePermission();
  const [reports, setReports] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    reportsService
      .list({ targetType, targetId, limit: 20 })
      .then((res) => setReports(res.data))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [targetType, targetId]);

  React.useEffect(load, [load]);

  async function review(
    id: string,
    status: "reviewed" | "rejected" | "resolved",
  ) {
    setBusyId(id);
    try {
      await reportsService.review(id, status);
      toast.success("گزارش به‌روز شد");
      load();
    } catch (e) {
      toast.error(parseApiError(e).message);
    } finally {
      setBusyId(null);
    }
  }

  // Hide the entire panel when there's nothing to show (keeps the page tight).
  if (!loading && reports.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Flag className="h-4 w-4 text-amber-500" />
          گزارش‌های ثبت‌شده ({formatNumber(reports.length)})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <p className="text-xs text-muted-foreground">در حال بارگذاری…</p>
        ) : (
          reports.map((r) => (
            <div
              key={r.id}
              className="rounded-md border border-border bg-muted/30 p-3 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-medium">{r.reason}</p>
                  {r.description ? (
                    <p className="text-xs leading-6 text-muted-foreground">
                      {r.description}
                    </p>
                  ) : null}
                  <p className="text-[11px] text-muted-foreground">
                    {r.reporter ? displayName(r.reporter) : "گزارش‌گر ناشناس"}{" "}
                    · {formatRelativeTime(r.createdAt)}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    r.status === "pending"
                      ? "border-amber-500/40 bg-amber-500/5 text-amber-700"
                      : r.status === "resolved"
                        ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700"
                        : ""
                  }
                >
                  {REPORT_STATUS_LABEL[r.status]}
                </Badge>
              </div>
              {can("moderation.manage") && r.status === "pending" ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === r.id}
                    onClick={() => review(r.id, "reviewed")}
                  >
                    بررسی شد
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === r.id}
                    onClick={() => review(r.id, "resolved")}
                  >
                    حل شد
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === r.id}
                    onClick={() => review(r.id, "rejected")}
                  >
                    رد
                  </Button>
                  {busyId === r.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : null}
                </div>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------------------------------------------------------------------- */
/*  Comments panel — comments under a question (top-level use).                 */
/* ---------------------------------------------------------------------------- */

function CommentsPanel({
  targetType,
  targetId,
}: {
  targetType: "question" | "answer";
  targetId: string;
}) {
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(() => {
    setLoading(true);
    commentsService
      .listForTarget(targetType, targetId)
      .then((list) => setComments(list))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [targetType, targetId]);

  React.useEffect(load, [load]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <MessageSquare className="h-4 w-4" />
          کامنت‌ها ({formatNumber(comments.length)})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <p className="text-xs text-muted-foreground">در حال بارگذاری…</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            هنوز کامنتی ثبت نشده است.
          </p>
        ) : (
          comments.map((c) => (
            <CommentRow key={c.id} comment={c} onChanged={load} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------------------------------------------------------------------- */
/*  Collapsible "show comments" toggle inside each AnswerRow.                   */
/* ---------------------------------------------------------------------------- */

function AnswerCommentsToggle({ answerId }: { answerId: string }) {
  const [open, setOpen] = React.useState(false);
  const [comments, setComments] = React.useState<Comment[] | null>(null);
  const [loading, setLoading] = React.useState(false);

  function load() {
    setLoading(true);
    commentsService
      .listForTarget("answer", answerId)
      .then((list) => setComments(list))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }

  function toggle() {
    if (!open && comments === null) load();
    setOpen((o) => !o);
  }

  return (
    <div className="mt-2 border-t border-border pt-2">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronDown
          className={
            "h-3 w-3 transition-transform " + (open ? "rotate-180" : "")
          }
        />
        کامنت‌های این پاسخ
        {comments !== null ? (
          <span className="ms-1">({formatNumber(comments.length)})</span>
        ) : null}
      </button>
      {open ? (
        <div className="mt-2 space-y-1.5 pl-3">
          {loading ? (
            <p className="text-[11px] text-muted-foreground">در حال بارگذاری…</p>
          ) : comments && comments.length > 0 ? (
            comments.map((c) => (
              <CommentRow key={c.id} comment={c} onChanged={load} compact />
            ))
          ) : (
            <p className="text-[11px] text-muted-foreground">
              کامنتی ثبت نشده است.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------------------- */
/*  Per-comment row used by both panels (top-level + answer thread).            */
/* ---------------------------------------------------------------------------- */

function CommentRow({
  comment,
  onChanged,
  compact = false,
}: {
  comment: Comment;
  onChanged: () => void;
  compact?: boolean;
}) {
  const { can } = usePermission();
  const [busy, setBusy] = React.useState(false);

  async function changeStatus(status: CommentStatus) {
    setBusy(true);
    try {
      await commentsService.update(comment.id, { status });
      toast.success("کامنت به‌روز شد");
      onChanged();
    } catch (e) {
      toast.error(parseApiError(e).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("این کامنت حذف شود؟")) return;
    setBusy(true);
    try {
      await commentsService.remove(comment.id);
      toast.success("کامنت حذف شد");
      onChanged();
    } catch (e) {
      toast.error(parseApiError(e).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={
        "rounded-md border bg-muted/30 " +
        (compact
          ? "border-border/60 p-2 text-xs"
          : "border-border p-3 text-sm")
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          <Avatar className="h-5 w-5">
            {comment.author?.avatar ? (
              <AvatarImage
                src={mediaUrl(comment.author.avatar)}
                alt={displayName(comment.author)}
              />
            ) : null}
            <AvatarFallback className="text-[10px]">
              {userInitials(comment.author)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{displayName(comment.author)}</span>
          <span className="text-muted-foreground">
            · {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        <StatusBadge status={comment.status} />
      </div>
      <p className="mt-1 leading-6 whitespace-pre-wrap">{comment.body}</p>
      {can("moderation.manage") || can("comments.delete") ? (
        <div className="mt-1 flex flex-wrap gap-1">
          {can("moderation.manage") && comment.status !== "hidden" ? (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => changeStatus("hidden")}
            >
              <EyeOff className="h-3 w-3" />
              پنهان
            </Button>
          ) : null}
          {can("moderation.manage") && comment.status === "hidden" ? (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => changeStatus("active")}
            >
              <ShieldCheck className="h-3 w-3" />
              بازگردانی
            </Button>
          ) : null}
          {can("comments.delete") ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={busy}
              onClick={remove}
            >
              {busy ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              حذف
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------------------- */
/*  Duplicate-link editor — small inline form that appears only when the        */
/*  status is `duplicate`. Lets admin paste the canonical question id.          */
/* ---------------------------------------------------------------------------- */

function DuplicateLinkEditor({
  questionId,
  duplicateOfId,
  onSaved,
}: {
  questionId: string;
  duplicateOfId: number | null;
  onSaved: () => void;
}) {
  const [value, setValue] = React.useState<string>(
    duplicateOfId == null ? "" : String(duplicateOfId),
  );
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setValue(duplicateOfId == null ? "" : String(duplicateOfId));
  }, [duplicateOfId]);

  async function save(nextValue: number | null) {
    setBusy(true);
    try {
      await questionsService.update(questionId, {
        duplicateOfQuestionId: nextValue,
      });
      toast.success("سؤال مرجع ذخیره شد");
      onSaved();
    } catch (e) {
      toast.error(parseApiError(e).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1.5 sm:col-span-2">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Link2 className="h-3 w-3" />
        شناسهٔ سؤال مرجع (canonical)
      </p>
      <div className="flex gap-2">
        <Input
          dir="ltr"
          inputMode="numeric"
          placeholder="مثلاً 1234"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
          disabled={busy}
          className="font-mono"
        />
        <Button
          type="button"
          size="sm"
          disabled={busy || value.trim() === ""}
          onClick={() => {
            const n = Number(value);
            if (!Number.isFinite(n) || n <= 0) {
              toast.error("شناسهٔ معتبر وارد کنید");
              return;
            }
            save(n);
          }}
        >
          {busy ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Save className="h-3 w-3" />
          )}
          ذخیره
        </Button>
        {duplicateOfId != null ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              setValue("");
              save(null);
            }}
          >
            <X className="h-3 w-3" />
            پاک‌سازی
          </Button>
        ) : null}
      </div>
      {duplicateOfId != null ? (
        <p className="text-[11px] text-muted-foreground">
          این سؤال به‌عنوان تکراریِ سؤال شمارهٔ{" "}
          <span dir="ltr" className="font-mono">
            #{duplicateOfId}
          </span>{" "}
          علامت خورده است.
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          هنوز سؤال مرجعی تنظیم نشده است.
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------- */
/*  Audit-log panel — moderation actions taken on this question.                */
/* ---------------------------------------------------------------------------- */

const MOD_ACTION_LABEL: Record<string, string> = {
  hide: "پنهان‌سازی",
  restore: "بازگردانی",
  delete: "حذف",
  "report.reviewed": "گزارش بررسی شد",
  "report.rejected": "گزارش رد شد",
  "report.resolved": "گزارش حل شد",
};

function AuditLogPanel({
  targetType,
  targetId,
}: {
  targetType: "question" | "answer";
  targetId: string;
}) {
  const [logs, setLogs] = React.useState<ModerationLog[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    moderationService
      .logs({ targetType, targetId, limit: 20 })
      .then((res) => {
        if (active) setLogs(res.data);
      })
      .catch(() => active && setLogs([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [targetType, targetId]);

  if (!loading && logs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <History className="h-4 w-4" />
          تاریخچهٔ اقدامات تیم ({formatNumber(logs.length)})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {loading ? (
          <p className="text-xs text-muted-foreground">در حال بارگذاری…</p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start justify-between gap-2 rounded-md border border-border bg-muted/30 p-2 text-xs"
            >
              <div className="min-w-0 flex-1">
                <p>
                  <Badge variant="outline">
                    {MOD_ACTION_LABEL[log.action] ?? log.action}
                  </Badge>{" "}
                  توسط {log.moderator ? displayName(log.moderator) : "تیم"}
                </p>
                {log.reason ? (
                  <p className="mt-0.5 text-muted-foreground">
                    دلیل: {log.reason}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {formatRelativeTime(log.createdAt)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------------------------------------------------------------------- */
/*  SEO panel — seoTitle / seoDescription / ogImage editor for the question.    */
/*  Soft caps (60 / 160) match Google's display limits; hard caps (160 / 255)   */
/*  match the backend column lengths.                                           */
/* ---------------------------------------------------------------------------- */

const SEO_TITLE_HARD = 160;
const SEO_TITLE_SOFT = 60;
const SEO_DESC_HARD = 255;
const SEO_DESC_SOFT = 160;

function SeoPanel({
  question,
  onSaved,
}: {
  question: Question;
  onSaved: () => void;
}) {
  const [title, setTitle] = React.useState(question.seoTitle ?? "");
  const [description, setDescription] = React.useState(
    question.seoDescription ?? "",
  );
  const [image, setImage] = React.useState<string | null>(question.ogImage);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  // Re-sync when the parent reloads (e.g. after a save we want to drop the
  // local form-state if the backend rejected a field).
  React.useEffect(() => {
    setTitle(question.seoTitle ?? "");
    setDescription(question.seoDescription ?? "");
    setImage(question.ogImage);
  }, [
    question.id,
    question.seoTitle,
    question.seoDescription,
    question.ogImage,
  ]);

  const dirty =
    (question.seoTitle ?? "") !== title ||
    (question.seoDescription ?? "") !== description ||
    (question.ogImage ?? null) !== (image ?? null);

  async function save() {
    setSaving(true);
    try {
      await questionsService.update(question.id, {
        seoTitle: title.trim() || undefined,
        seoDescription: description.trim() || undefined,
        ogImage: image ?? "",
      });
      toast.success("اطلاعات SEO ذخیره شد");
      onSaved();
    } catch (e) {
      toast.error(parseApiError(e).message);
    } finally {
      setSaving(false);
    }
  }

  async function pickImage(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("فقط فایل تصویری مجاز است");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حداکثر حجم تصویر ۵ مگابایت است");
      return;
    }
    setUploading(true);
    try {
      const item = await mediaService.upload({ file, folder: "questions" });
      setImage(item.url);
      toast.success("تصویر بارگذاری شد. برای ثبت روی «ذخیره» بزنید.");
    } catch (e) {
      toast.error(parseApiError(e).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4" />
          سئو و کارت اشتراک‌گذاری (OG)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-muted-foreground">
              عنوان سئو
            </label>
            <CharCounter
              len={title.length}
              soft={SEO_TITLE_SOFT}
              hard={SEO_TITLE_HARD}
            />
          </div>
          <Input
            value={title}
            maxLength={SEO_TITLE_HARD}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={question.title}
          />
          <p className="text-[11px] text-muted-foreground">
            اگر خالی بماند، عنوان خودِ سؤال استفاده می‌شود.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-muted-foreground">
              توضیحات متا
            </label>
            <CharCounter
              len={description.length}
              soft={SEO_DESC_SOFT}
              hard={SEO_DESC_HARD}
            />
          </div>
          <Textarea
            value={description}
            maxLength={SEO_DESC_HARD}
            rows={3}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={(question.body ?? "").slice(0, 160)}
          />
          <p className="text-[11px] text-muted-foreground">
            اگر خالی بماند، خلاصه‌ای از متن سؤال استفاده می‌شود.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            تصویر کارت اشتراک‌گذاری (OG)
          </label>
          {image ? (
            <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(image) ?? image}
                alt="OG preview"
                className="h-16 w-28 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-[11px] text-muted-foreground"
                  dir="ltr"
                >
                  {image}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setImage(null)}
                disabled={saving}
              >
                <X className="h-3 w-3" />
                حذف
              </Button>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border bg-muted/20 p-3 text-center">
              <p className="text-[11px] text-muted-foreground">
                تصویری انتخاب نشده — در صورت خالی بودن، لوگوی سایت روی کارت OG
                نشان داده می‌شود.
              </p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) pickImage(f);
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || saving}
            >
              {uploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ImagePlus className="h-3 w-3" />
              )}
              بارگذاری تصویر
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!dirty || saving}
            onClick={() => {
              setTitle(question.seoTitle ?? "");
              setDescription(question.seoDescription ?? "");
              setImage(question.ogImage);
            }}
          >
            <X className="h-3 w-3" />
            انصراف
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!dirty || saving}
            onClick={save}
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            ذخیرهٔ SEO
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CharCounter({
  len,
  soft,
  hard,
}: {
  len: number;
  soft: number;
  hard: number;
}) {
  const overHard = len > hard;
  const overSoft = len > soft;
  return (
    <span
      className={
        "font-mono text-[10px] " +
        (overHard
          ? "text-destructive"
          : overSoft
            ? "text-amber-600 dark:text-amber-400"
            : "text-muted-foreground")
      }
      dir="ltr"
    >
      {len} / {soft} (حد سخت {hard})
    </span>
  );
}
