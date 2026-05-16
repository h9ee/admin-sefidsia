"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Copy,
  Loader2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { errorLogsService } from "@/services/error-logs.service";
import { parseApiError } from "@/lib/api-error";
import { formatDateTime, toPersianDigits } from "@/lib/format";
import type { ErrorLog, ErrorLogLevel } from "@/types";

type Props = {
  id: number | null;
  onClose: () => void;
  onChanged?: () => void;
};

const LEVEL_LABEL: Record<ErrorLogLevel, string> = {
  critical: "بحرانی",
  error: "خطا",
  warn: "هشدار",
};

const LEVEL_CLASS: Record<ErrorLogLevel, string> = {
  critical:
    "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  error:
    "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  warn:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

export function ErrorLogDetailDialog({ id, onClose, onChanged }: Props) {
  const open = id !== null;
  const [log, setLog] = useState<ErrorLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (id === null) {
      setLog(null);
      return;
    }
    let active = true;
    setLoading(true);
    errorLogsService
      .detail(id)
      .then((res) => active && setLog(res))
      .catch((e) => active && toast.error(parseApiError(e).message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const handleResolveToggle = async () => {
    if (!log) return;
    setBusy(true);
    try {
      const next = log.resolved
        ? await errorLogsService.unresolve(log.id)
        : await errorLogsService.resolve(log.id);
      setLog(next);
      toast.success(
        next.resolved
          ? "به‌عنوان حل‌شده علامت‌گذاری شد"
          : "وضعیت حل‌شده برداشته شد",
      );
      onChanged?.();
    } catch (e) {
      toast.error(parseApiError(e).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!log) return;
    setBusy(true);
    try {
      await errorLogsService.remove(log.id);
      toast.success("حذف شد");
      onChanged?.();
      onClose();
    } catch (e) {
      toast.error(parseApiError(e).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            جزئیات خطا {log ? `#${toPersianDigits(log.id)}` : ""}
          </DialogTitle>
          <DialogDescription>
            اطلاعات کامل خطا برای بررسی و رفع.
          </DialogDescription>
        </DialogHeader>

        {loading || !log ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-4 text-sm">
              <Section title="پیام">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={LEVEL_CLASS[log.level]}>
                    {LEVEL_LABEL[log.level]}
                  </Badge>
                  {log.statusCode ? (
                    <Badge variant="outline" dir="ltr">
                      {toPersianDigits(log.statusCode)}
                    </Badge>
                  ) : null}
                  {log.code ? (
                    <code
                      className="rounded bg-muted px-1.5 py-0.5 text-xs"
                      dir="ltr"
                    >
                      {log.code}
                    </code>
                  ) : null}
                  {log.resolved ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    >
                      <CheckCircle2 className="ms-1 h-3 w-3" />
                      حل‌شده
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-2 text-base font-medium">{log.messageFa}</p>
                <p
                  className="mt-1 break-words text-xs text-muted-foreground"
                  dir="ltr"
                >
                  {log.name ? <span className="me-1">{log.name}:</span> : null}
                  {log.message}
                </p>
              </Section>

              <Field label="زمان">{formatDateTime(log.createdAt)}</Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="منبع">{log.source}</Field>
                <Field label="آدرس" mono ltr>
                  {log.url ?? log.path ?? "—"}
                </Field>
                <Field label="متد" mono ltr>
                  {log.method ?? "—"}
                </Field>
                <Field label="IP" mono ltr>
                  {log.ip ?? "—"}
                </Field>
                <Field label="کاربر">
                  {log.user
                    ? log.user.name ||
                      log.user.username ||
                      `#${log.user.id}`
                    : "مهمان"}
                </Field>
                <Field label="رفع توسط">
                  {log.resolver
                    ? log.resolver.name ||
                      log.resolver.username ||
                      `#${log.resolver.id}`
                    : "—"}
                </Field>
              </div>

              {log.userAgent ? (
                <Field label="User-Agent" mono ltr>
                  {log.userAgent}
                </Field>
              ) : null}

              {log.params && Object.keys(log.params).length > 0 ? (
                <JsonSection title="پارامترهای مسیر" value={log.params} />
              ) : null}
              {log.query && Object.keys(log.query).length > 0 ? (
                <JsonSection title="پارامترهای کوئری" value={log.query} />
              ) : null}
              {log.body && Object.keys(log.body).length > 0 ? (
                <JsonSection title="بدنه درخواست" value={log.body} />
              ) : null}
              {log.details ? (
                <JsonSection title="جزئیات خطا" value={log.details} />
              ) : null}
              {log.stack ? (
                <Section title="پشته خطا (stack trace)">
                  <CodeBlock value={log.stack} />
                </Section>
              ) : null}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            بستن
          </Button>
          {log ? (
            <>
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={busy}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                حذف
              </Button>
              <Button
                variant={log.resolved ? "outline" : "default"}
                onClick={handleResolveToggle}
                disabled={busy}
              >
                {log.resolved ? (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    باز کردن مجدد
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    علامت حل‌شده
                  </>
                )}
              </Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  mono,
  ltr,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  ltr?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-0.5 break-words text-sm ${mono ? "font-mono" : ""}`}
        dir={ltr ? "ltr" : undefined}
      >
        {children}
      </p>
    </div>
  );
}

function JsonSection({ title, value }: { title: string; value: unknown }) {
  const text = (() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  })();
  return (
    <Section title={title}>
      <CodeBlock value={text} />
    </Section>
  );
}

function CodeBlock({ value }: { value: string }) {
  return (
    <div className="relative">
      <pre
        className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 text-[11px] leading-relaxed text-foreground/90"
        dir="ltr"
      >
        {value}
      </pre>
      <button
        type="button"
        onClick={() => {
          if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard
              .writeText(value)
              .then(() => toast.success("کپی شد"))
              .catch(() => toast.error("کپی ناموفق بود"));
          }
        }}
        className="absolute end-2 top-2 rounded-md border border-border bg-card px-1.5 py-1 text-[10px] text-muted-foreground hover:text-foreground"
        aria-label="کپی"
      >
        <Copy className="h-3 w-3" />
      </button>
    </div>
  );
}
