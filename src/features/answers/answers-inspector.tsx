"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, EyeOff, Search, ShieldCheck, Stethoscope, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { answersService, questionsService } from "@/services/questions.service";
import { moderationService } from "@/services/reports.service";
import { parseApiError } from "@/lib/api-error";
import { formatRelativeTime } from "@/lib/format";
import { displayName, userInitials } from "@/lib/user";
import type { Answer } from "@/types";

/**
 * Backend does not expose a global "all answers" listing — answers belong to a
 * question. This inspector lets admins look up the question by its slug and
 * moderate its answers.
 */
export function AnswersInspector() {
  const [slug, setSlug] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [questionTitle, setQuestionTitle] = useState<string | null>(null);

  const search = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const q = await questionsService.getBySlug(slug.trim());
      setQuestionTitle(q.title);
      const list = await answersService.listForQuestion(q.id);
      setAnswers(list);
    } catch (e) {
      toast.error(parseApiError(e).message);
      setQuestionTitle(null);
      setAnswers([]);
    } finally {
      setLoading(false);
    }
  };

  const reload = async () => {
    if (!questionTitle) return;
    await search();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>جستجوی پاسخ‌ها بر اساس سوال</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              search();
            }}
          >
            <div className="relative flex-1 min-w-64">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="شناسه (slug) سوال را وارد کنید…"
                dir="ltr"
                className="pe-9"
              />
            </div>
            <Button type="submit" disabled={loading}>
              جستجو
            </Button>
          </form>
          {questionTitle ? (
            <p className="mt-3 text-xs text-muted-foreground">
              سوال: <span className="font-medium text-foreground">{questionTitle}</span>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {answers.length === 0 ? (
          <EmptyState
            title={questionTitle ? "پاسخی ثبت نشده است" : "هنوز سوالی انتخاب نشده"}
            description={
              questionTitle
                ? "این سوال هنوز هیچ پاسخی دریافت نکرده است."
                : "برای مشاهده پاسخ‌ها، slug یک سوال را وارد کنید."
            }
          />
        ) : (
          answers.map((a) => (
            <Card key={a.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      {a.author?.avatar ? (
                        <AvatarImage src={a.author.avatar} alt={displayName(a.author)} />
                      ) : null}
                      <AvatarFallback>{userInitials(a.author)}</AvatarFallback>
                    </Avatar>
                    <div className="text-xs">
                      <span className="font-medium">{displayName(a.author)}</span>
                      <span className="ms-1 text-muted-foreground">
                        · {formatRelativeTime(a.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {a.isDoctorAnswer ? (
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
                    <StatusBadge status={a.status} />
                  </div>
                </div>
                <p className="text-sm leading-7">{a.body}</p>
                <PermissionGuard permission="moderation.manage">
                  <div className="flex flex-wrap gap-1 border-t border-border pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await moderationService.act({
                            targetType: "answer",
                            targetId: a.id,
                            action: "hide",
                          });
                          await reload();
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
                            targetId: a.id,
                            action: "restore",
                          });
                          await reload();
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
                            await answersService.remove(a.id);
                            await reload();
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
          ))
        )}
      </div>
    </>
  );
}
