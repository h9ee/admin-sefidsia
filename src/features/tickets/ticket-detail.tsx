"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  ShieldAlert,
  StickyNote,
  Trash2,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ticketsService } from "@/services";
import type {
  Ticket,
  TicketActivity,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/types";
import type { User } from "@/types/auth";
import { useAuthStore } from "@/store/auth.store";
import { parseApiError } from "@/lib/api-error";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  ACTION_LABELS,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_VARIANT,
  STATUS_LABELS,
  STATUS_VARIANT,
  userFullName,
} from "./ticket-labels";

type StaffOption = Pick<
  User,
  "id" | "username" | "firstName" | "lastName" | "userType" | "avatar"
>;

export function TicketDetail({ id }: { id: number }) {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const currentUserId =
    currentUser?.id != null ? Number(currentUser.id) : undefined;
  const isDeveloper = currentUser?.roles?.some((r) => r.slug === "developer");

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [activities, setActivities] = useState<TicketActivity[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [reply, setReply] = useState("");
  const [isNote, setIsNote] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      ticketsService.get(id),
      ticketsService.activities(id).catch(() => [] as TicketActivity[]),
      ticketsService.staff().catch(() => [] as StaffOption[]),
    ])
      .then(([t, a, s]) => {
        if (!alive) return;
        setTicket(t);
        setActivities(a);
        setStaff(s);
      })
      .catch((err) => alive && toast.error(parseApiError(err).message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id, reload]);

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await ticketsService.reply(id, {
        body: reply.trim(),
        isInternalNote: isNote,
      });
      setReply("");
      setIsNote(false);
      toast.success(isNote ? "یادداشت ثبت شد" : "پاسخ ارسال شد");
      setReload((n) => n + 1);
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setSending(false);
    }
  }

  async function patch(payload: {
    status?: TicketStatus;
    priority?: TicketPriority;
    category?: TicketCategory;
    assignedTo?: number | null;
  }) {
    try {
      await ticketsService.update(id, payload);
      toast.success("ذخیره شد");
      setReload((n) => n + 1);
    } catch (err) {
      toast.error(parseApiError(err).message);
    }
  }

  async function close() {
    if (!confirm("تیکت بسته شود؟")) return;
    try {
      await ticketsService.close(id);
      toast.success("تیکت بسته شد");
      setReload((n) => n + 1);
    } catch (err) {
      toast.error(parseApiError(err).message);
    }
  }

  async function remove() {
    if (!confirm("تیکت حذف شود؟ این عمل قابل بازگشت نیست.")) return;
    try {
      await ticketsService.remove(id);
      toast.success("تیکت حذف شد");
      router.replace("/tickets");
    } catch (err) {
      toast.error(parseApiError(err).message);
    }
  }

  if (loading && !ticket) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-44" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        تیکت یافت نشد.
      </div>
    );
  }

  const messages = ticket.messages ?? [];
  const isClosed = ticket.status === "closed";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Link
            href="/tickets"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="h-4 w-4" />
            بازگشت به فهرست
          </Link>
          <h1 className="mt-2 text-xl font-bold leading-tight">
            {ticket.subject}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-muted-foreground" dir="ltr">
              {ticket.ticketNumber}
            </span>
            <Badge variant={STATUS_VARIANT[ticket.status]}>
              {STATUS_LABELS[ticket.status]}
            </Badge>
            <Badge variant={PRIORITY_VARIANT[ticket.priority]}>
              {PRIORITY_LABELS[ticket.priority]}
            </Badge>
            <Badge variant="outline">{CATEGORY_LABELS[ticket.category]}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {!isClosed && (
            <Button variant="outline" onClick={close}>
              <CheckCircle2 className="h-4 w-4 me-1" />
              بستن تیکت
            </Button>
          )}
          {isDeveloper && (
            <Button variant="ghost" className="text-destructive" onClick={remove}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4 min-w-0">
          <ThreadView
            ticket={ticket}
            messages={messages}
            currentUserId={currentUserId}
          />

          {!isClosed && (
            <form
              onSubmit={submitReply}
              className="rounded-lg border border-border bg-card p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">پاسخ جدید</h3>
                <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                  <Switch checked={isNote} onCheckedChange={setIsNote} />
                  <span
                    className={cn(
                      "inline-flex items-center gap-1",
                      isNote
                        ? "text-amber-600 dark:text-amber-400 font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    <StickyNote className="h-3.5 w-3.5" />
                    یادداشت داخلی (نامرئی برای کاربر)
                  </span>
                </label>
              </div>
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={5}
                placeholder={
                  isNote
                    ? "یادداشت برای تیم پشتیبانی…"
                    : "پاسخ خود را برای کاربر بنویسید…"
                }
                disabled={sending}
                className={cn(
                  isNote && "bg-amber-500/5 border-amber-500/40"
                )}
              />
              <div className="flex items-center justify-end gap-2">
                <Button type="submit" disabled={sending || !reply.trim()}>
                  {isNote ? "ثبت یادداشت" : "ارسال پاسخ"}
                </Button>
              </div>
            </form>
          )}

          {isClosed && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              این تیکت بسته شده است. برای پاسخ جدید، کاربر باید تیکت جدیدی باز کند.
            </div>
          )}
        </div>

        <aside className="space-y-3 min-w-0">
          <Panel title="کاربر">
            <PersonRow
              user={ticket.requester}
              meta={ticket.requester?.mobile ?? undefined}
            />
          </Panel>

          <Panel title="مسئول رسیدگی">
            <Select
              value={ticket.assignedTo == null ? "none" : String(ticket.assignedTo)}
              onValueChange={(v) =>
                patch({ assignedTo: v === "none" ? null : Number(v) })
              }
              disabled={isClosed}
            >
              <SelectTrigger>
                <SelectValue placeholder="انتخاب مسئول" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— بدون مسئول</SelectItem>
                {currentUserId != null && (
                  <SelectItem value={String(currentUserId)}>
                    <UserCheck className="h-3.5 w-3.5 inline me-1" />
                    من ({userFullName(currentUser ?? undefined)})
                  </SelectItem>
                )}
                {staff
                  .filter((s) => Number(s.id) !== currentUserId)
                  .map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {userFullName(s)} —{" "}
                      <span className="text-xs text-muted-foreground">
                        {s.userType === "admin" ? "ادمین" : "پزشک"}
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Panel>

          <Panel title="وضعیت">
            <Select
              value={ticket.status}
              onValueChange={(v) => patch({ status: v as TicketStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Panel>

          <Panel title="اولویت">
            <Select
              value={ticket.priority}
              onValueChange={(v) => patch({ priority: v as TicketPriority })}
              disabled={isClosed}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Panel>

          <Panel title="دسته‌بندی">
            <Select
              value={ticket.category}
              onValueChange={(v) => patch({ category: v as TicketCategory })}
              disabled={isClosed}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Panel>

          <Panel title="جدول زمانی">
            <ul className="space-y-2.5 text-xs">
              {activities.length === 0 && (
                <li className="text-muted-foreground">رویدادی ثبت نشده.</li>
              )}
              {activities.map((a) => (
                <li key={a.id} className="flex gap-2">
                  <span className="size-1.5 rounded-full bg-foreground/40 mt-1.5 shrink-0" />
                  <div>
                    <div>
                      <span className="text-foreground/80">
                        {ACTION_LABELS[a.action] ?? a.action}
                      </span>{" "}
                      {a.actor && (
                        <span className="text-muted-foreground">
                          — {userFullName(a.actor)}
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground">
                      {formatRelativeTime(a.createdAt)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function ThreadView({
  ticket,
  messages,
  currentUserId,
}: {
  ticket: Ticket;
  messages: NonNullable<Ticket["messages"]>;
  currentUserId?: number;
}) {
  const list = useMemo(() => messages, [messages]);
  return (
    <div className="space-y-3">
      {list.map((m) => {
        const isMine = m.userId === currentUserId;
        const isStaff =
          m.author?.userType === "admin" || m.author?.userType === "doctor";
        return (
          <article
            key={m.id}
            className={cn(
              "rounded-lg border bg-card overflow-hidden",
              m.isInternalNote
                ? "border-amber-500/40 bg-amber-500/5"
                : isStaff
                ? "border-border"
                : "border-border"
            )}
          >
            <header
              className={cn(
                "flex items-center justify-between gap-3 border-b px-4 py-2",
                m.isInternalNote
                  ? "border-amber-500/30 bg-amber-500/10"
                  : "border-border bg-muted/40"
              )}
            >
              <div className="flex items-center gap-2">
                <Avatar className="size-7">
                  {m.author?.avatar && (
                    <AvatarImage src={m.author.avatar} alt={userFullName(m.author)} />
                  )}
                  <AvatarFallback>
                    {userFullName(m.author).slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <span className="font-medium">{userFullName(m.author)}</span>
                  {isStaff && (
                    <Badge variant="secondary" className="me-1 ms-2">
                      پشتیبانی
                    </Badge>
                  )}
                  {m.isInternalNote && (
                    <Badge variant="warning" className="ms-2">
                      <ShieldAlert className="h-3 w-3 me-1" />
                      یادداشت داخلی
                    </Badge>
                  )}
                  {isMine && (
                    <span className="ms-2 text-xs text-muted-foreground">(شما)</span>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(m.createdAt)}
              </span>
            </header>
            <div className="px-4 py-3 text-sm leading-7 whitespace-pre-line">
              {m.body}
            </div>
            {m.attachments && m.attachments.length > 0 && (
              <>
                <Separator />
                <div className="px-4 py-2 flex flex-wrap gap-2">
                  {m.attachments.map((a, i) => (
                    <a
                      key={i}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs rounded-md border border-border px-2 py-1 hover:bg-accent"
                    >
                      {a.name ?? a.url}
                    </a>
                  ))}
                </div>
              </>
            )}
          </article>
        );
      })}
      {list.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          هنوز پیامی در این تیکت ثبت نشده.
        </div>
      )}
      {/* render closed-state stats */}
      {ticket.closedAt && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground text-center">
          بسته‌شده در {formatRelativeTime(ticket.closedAt)}
          {ticket.userRating != null && (
            <> — امتیاز کاربر: <strong className="text-foreground">{ticket.userRating}/۵</strong></>
          )}
        </div>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-3">
      <h3 className="mb-2 text-xs font-medium text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function PersonRow({
  user,
  meta,
}: {
  user: Ticket["requester"] | undefined;
  meta?: string;
}) {
  if (!user) return <div className="text-sm text-muted-foreground">—</div>;
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-9">
        {user.avatar && <AvatarImage src={user.avatar} alt={userFullName(user)} />}
        <AvatarFallback>{userFullName(user).slice(0, 1)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{userFullName(user)}</div>
        {meta && (
          <div className="text-xs text-muted-foreground truncate" dir="ltr">
            {meta}
          </div>
        )}
      </div>
    </div>
  );
}
