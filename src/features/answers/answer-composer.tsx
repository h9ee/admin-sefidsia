"use client";

import * as React from "react";
import { Loader2, MessageSquarePlus, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { answersService } from "@/services/questions.service";
import { parseApiError } from "@/lib/api-error";
import type { Answer } from "@/types";

interface Props {
  questionId: string;
  /**
   * Called with the freshly-created answer so the parent can prepend it to
   * the answers list without a full refetch (still nice to fire a load() too
   * to keep counters fresh).
   */
  onCreated?: (answer: Answer) => void;
}

const MIN_LENGTH = 30;
const MAX_LENGTH = 8000;

/**
 * Admin/doctor surface for posting an answer to a question. Mirrors the
 * client-side composer but is gated on the `answers.create` permission and
 * uses the same backend route (`POST /questions/:questionId/answers`).
 */
export function AnswerComposer({ questionId, onCreated }: Props) {
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const trimmed = body.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_LENGTH;
  const remaining = MAX_LENGTH - body.length;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (trimmed.length < MIN_LENGTH) {
      toast.error(`پاسخ باید حداقل ${MIN_LENGTH} کاراکتر باشد.`);
      return;
    }
    setBusy(true);
    try {
      const created = await answersService.create(questionId, trimmed);
      setBody("");
      toast.success("پاسخ شما ثبت شد.");
      onCreated?.(created);
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PermissionGuard permission="answers.create">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquarePlus className="size-4" />
            پاسخ‌گویی به این پرسش
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              maxLength={MAX_LENGTH}
              disabled={busy}
              placeholder="پاسخ تخصصی خود را بنویسید — با ذکر منابع علمی توصیه می‌شود…"
              aria-invalid={tooShort}
              className={tooShort ? "border-destructive/60" : undefined}
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground tabular-nums">
                {tooShort ? (
                  <span className="text-destructive">
                    حداقل {MIN_LENGTH.toLocaleString("fa-IR")} کاراکتر
                  </span>
                ) : (
                  <>
                    {trimmed.length.toLocaleString("fa-IR")} /{" "}
                    {MAX_LENGTH.toLocaleString("fa-IR")}
                    {remaining < MAX_LENGTH * 0.1 && (
                      <span className="ms-2 text-amber-600 dark:text-amber-400">
                        ({remaining.toLocaleString("fa-IR")} باقی‌مانده)
                      </span>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {body && !busy && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setBody("")}
                  >
                    <X className="size-4" />
                    پاک کردن
                  </Button>
                )}
                <Button
                  type="submit"
                  size="sm"
                  disabled={busy || trimmed.length < MIN_LENGTH}
                >
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  ارسال پاسخ
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </PermissionGuard>
  );
}
