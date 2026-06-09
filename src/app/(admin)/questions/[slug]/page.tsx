"use client";

import * as React from "react";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Edit3,
  EyeOff,
  Loader2,
  Save,
  Sparkles,
  ShieldCheck,
  Trash2,
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
import { PermissionGuard } from "@/components/permission/permission-guard";
import { AnswerComposer } from "@/features/answers/answer-composer";
import { questionsService, answersService } from "@/services/questions.service";
import { moderationService } from "@/services/reports.service";
import { parseApiError } from "@/lib/api-error";
import { formatRelativeTime, formatNumber } from "@/lib/format";
import { displayName, userInitials } from "@/lib/user";
import type { Answer, Question } from "@/types";

const warningLabel: Record<string, string> = {
  normal: "عادی",
  sensitive: "حساس",
  urgent: "ضروری",
};

export default function QuestionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  // Inline question-edit state (admin can fix typos / clarify wording).
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editAnonymous, setEditAnonymous] = useState(false);

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
        <>
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
                  <p className="text-xs text-muted-foreground">
                    {question.isAnonymous ? "ناشناس" : displayName(question.user)} · {" "}
                    {formatRelativeTime(question.createdAt)}
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
                        question.medicalWarningLevel === "urgent" ? "destructive" : "warning"
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
                    نمایش به‌صورت ناشناس (نام کاربر مخفی شود)
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
              <div className="flex flex-wrap gap-1">
                {question.tags?.map((t) => (
                  <Badge key={t.id} variant="outline">
                    {t.name}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>{formatNumber(question.viewCount)} بازدید</span>
                <span>{formatNumber(question.answerCount)} پاسخ</span>
                <span>{formatNumber(question.voteScore)} رای</span>
              </div>

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

          {/* Admin/doctor answer composer */}
          <AnswerComposer
            questionId={question.id}
            onCreated={(a) => {
              setAnswers((prev) => [a, ...prev]);
              // also bump the answerCount on the question card without a full reload
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
                <p className="text-xs text-muted-foreground">پاسخی ثبت نشده است.</p>
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
        </>
      )}
    </>
  );
}

/* ------------------- per-answer row with inline actions ------------------ */

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
    </div>
  );
}
