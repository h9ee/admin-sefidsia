"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Inbox, MessageSquare, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ticketsService, type ListTicketsParams } from "@/services";
import type {
  Paginated,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/types";
import { formatRelativeTime } from "@/lib/format";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_VARIANT,
  STATUS_LABELS,
  STATUS_VARIANT,
  userFullName,
} from "./ticket-labels";

const PAGE_SIZE = 15;

interface TicketsListProps {
  /** Default `unassigned` filter on (useful for an inbox-style tab) */
  defaultUnassigned?: boolean;
  /** Lock the listing to a specific status (no status filter shown). */
  lockedStatus?: TicketStatus;
}

export function TicketsList({ defaultUnassigned, lockedStatus }: TicketsListProps) {
  const [data, setData] = useState<Paginated<Ticket> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<TicketStatus | "all">(lockedStatus ?? "all");
  const [priority, setPriority] = useState<TicketPriority | "all">("all");
  const [category, setCategory] = useState<TicketCategory | "all">("all");
  const [unassignedOnly, setUnassignedOnly] = useState<boolean>(
    defaultUnassigned ?? false
  );

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const params: ListTicketsParams = {
      page,
      limit: PAGE_SIZE,
      status: status === "all" ? lockedStatus : status,
      priority: priority === "all" ? undefined : priority,
      category: category === "all" ? undefined : category,
      q: q.trim() || undefined,
      unassigned: unassignedOnly || undefined,
      sortBy: "lastActivityAt",
      sortOrder: "DESC",
    };
    ticketsService
      .list(params)
      .then((res) => alive && setData(res))
      .catch(
        () =>
          alive &&
          setData({ data: [], meta: { page, limit: PAGE_SIZE, total: 0, totalPages: 1 } })
      )
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [page, q, status, priority, category, unassignedOnly, lockedStatus]);

  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  const filtersActive = useMemo(
    () =>
      q ||
      status !== "all" ||
      priority !== "all" ||
      category !== "all" ||
      unassignedOnly,
    [q, status, priority, category, unassignedOnly]
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto] items-center">
        <div className="relative">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="جستجو در موضوع یا شماره تیکت…"
            className="ps-9"
          />
        </div>

        {!lockedStatus && (
          <Select
            value={status}
            onValueChange={(v) => {
              setPage(1);
              setStatus(v as TicketStatus | "all");
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="وضعیت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه وضعیت‌ها</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={priority}
          onValueChange={(v) => {
            setPage(1);
            setPriority(v as TicketPriority | "all");
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="اولویت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه اولویت‌ها</SelectItem>
            {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={category}
          onValueChange={(v) => {
            setPage(1);
            setCategory(v as TicketCategory | "all");
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="دسته‌بندی" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه دسته‌ها</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant={unassignedOnly ? "default" : "outline"}
          onClick={() => {
            setPage(1);
            setUnassignedOnly((v) => !v);
          }}
        >
          فقط واگذار نشده
        </Button>
      </div>

      {loading && !data && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {!loading && total === 0 && (
        <EmptyState
          icon={Inbox}
          title="تیکتی یافت نشد"
          description={
            filtersActive
              ? "هیچ تیکتی با فیلتر فعلی وجود ندارد."
              : "صبر کنید، اولین تیکت کاربران به‌زودی می‌رسد."
          }
        />
      )}

      {data && data.data.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <ul className="divide-y divide-border">
            {data.data.map((t) => (
              <li key={t.id}>
                <TicketRow ticket={t} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>
          {total > 0 && (
            <>
              نمایش{" "}
              <span className="text-foreground font-medium">
                {toPersianDigits((page - 1) * PAGE_SIZE + 1)}
              </span>{" "}
              تا{" "}
              <span className="text-foreground font-medium">
                {toPersianDigits(Math.min(page * PAGE_SIZE, total))}
              </span>{" "}
              از{" "}
              <span className="text-foreground font-medium">{toPersianDigits(total)}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            قبلی
          </Button>
          <span className="px-2 tabular-nums">
            {toPersianDigits(page)} / {toPersianDigits(totalPages)}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            بعدی
          </Button>
        </div>
      </div>
    </div>
  );
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className="flex flex-col gap-2 px-4 py-3.5 transition-colors hover:bg-accent/40 focus:bg-accent/40 focus:outline-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-mono" dir="ltr">
              {ticket.ticketNumber}
            </span>
            <Badge variant={STATUS_VARIANT[ticket.status]}>
              {STATUS_LABELS[ticket.status]}
            </Badge>
            <Badge variant={PRIORITY_VARIANT[ticket.priority]}>
              {ticket.priority === "urgent" && (
                <AlertTriangle className="h-3 w-3 me-1" />
              )}
              {PRIORITY_LABELS[ticket.priority]}
            </Badge>
            <Badge variant="outline">{CATEGORY_LABELS[ticket.category]}</Badge>
          </div>
          <h3 className="mt-1 font-medium text-sm leading-snug line-clamp-1">
            {ticket.subject}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
            {stripHtml(ticket.description)}
          </p>
        </div>
        <div className="text-end shrink-0 text-xs text-muted-foreground space-y-1">
          <div className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(ticket.lastActivityAt)}
          </div>
          {ticket.messages && (
            <div className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {toPersianDigits(ticket.messages.length)}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="text-muted-foreground">
          از{" "}
          <span className="text-foreground font-medium">
            {userFullName(ticket.requester)}
          </span>
        </div>
        <div
          className={cn(
            "rounded-full px-2 py-0.5",
            ticket.assignee
              ? "bg-secondary text-secondary-foreground"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          )}
        >
          {ticket.assignee
            ? `مسئول: ${userFullName(ticket.assignee)}`
            : "بدون مسئول"}
        </div>
      </div>
    </Link>
  );
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
