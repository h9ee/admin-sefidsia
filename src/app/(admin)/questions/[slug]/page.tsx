"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight, EyeOff, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PermissionGuard } from "@/components/permission/permission-guard";
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
                <div className="space-y-1">
                  <CardTitle>{question.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {question.isAnonymous ? "ناشناس" : displayName(question.user)} · {" "}
                    {formatRelativeTime(question.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
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
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="leading-7">{question.body}</p>
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

          <Card>
            <CardHeader>
              <CardTitle>پاسخ‌ها ({formatNumber(answers.length)})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {answers.length === 0 ? (
                <p className="text-xs text-muted-foreground">پاسخی ثبت نشده است.</p>
              ) : (
                answers.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg border border-border p-3 transition-colors hover:bg-muted/30"
                  >
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
                      <div className="flex items-center gap-1">
                        {a.isDoctorAnswer ? <Badge variant="secondary">پزشک</Badge> : null}
                        {a.isAccepted ? <Badge variant="success">پذیرفته شده</Badge> : null}
                        <StatusBadge status={a.status} />
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-7">{a.body}</p>
                    <PermissionGuard permission="moderation.manage">
                      <div className="mt-2 flex flex-wrap gap-1">
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
                              load();
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
                              load();
                              toast.success("پاسخ بازگردانده شد");
                            } catch (e) {
                              toast.error(parseApiError(e).message);
                            }
                          }}
                        >
                          <ShieldCheck className="h-3 w-3" />
                          بازگردانی
                        </Button>
                      </div>
                    </PermissionGuard>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
