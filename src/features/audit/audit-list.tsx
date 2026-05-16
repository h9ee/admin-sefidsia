"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DataTable, type Column } from "@/components/tables/data-table";
import { auditService } from "@/services/audit.service";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { displayName, userInitials } from "@/lib/user";
import type { AuditLog, Paginated } from "@/types";

const ACTION_LABEL: Record<string, string> = {
  create: "ایجاد",
  update: "ویرایش",
  delete: "حذف",
  restore: "بازگردانی",
  publish: "انتشار",
  review: "بررسی",
  verify: "تایید",
  reject: "رد",
  assign: "انتساب",
  unassign: "حذف انتساب",
  set: "تنظیم",
  login: "ورود",
  logout: "خروج",
};

const ENTITY_LABEL: Record<string, string> = {
  user: "کاربر",
  "user.role": "نقش کاربر",
  role: "نقش",
  "role.permission": "دسترسی نقش",
  permission: "دسترسی",
  category: "دسته",
  tag: "برچسب",
  article: "مقاله",
  doctor: "پزشک",
  report: "گزارش",
};

const ACTION_VARIANT: Record<string, "default" | "muted" | "success" | "warning" | "destructive" | "outline" | "secondary"> = {
  create: "success",
  update: "secondary",
  delete: "destructive",
  restore: "success",
  publish: "success",
  review: "secondary",
  verify: "success",
  reject: "destructive",
  assign: "secondary",
  unassign: "muted",
  set: "secondary",
};

export function AuditList() {
  const [data, setData] = useState<Paginated<AuditLog> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState<string>("all");
  const [action, setAction] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<AuditLog | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    auditService
      .list({
        page,
        limit: 20,
        entity: entity === "all" ? undefined : entity,
        action: action === "all" ? undefined : action,
        from: from || undefined,
        to: to || undefined,
      })
      .then((res) => active && setData(res))
      .catch(() =>
        active &&
        setData({ data: [], meta: { page, limit: 20, total: 0, totalPages: 1 } }),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, entity, action, from, to]);

  const columns = useMemo<Column<AuditLog>[]>(
    () => [
      {
        key: "actor",
        header: "کاربر",
        cell: (l) => (
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              {l.user?.avatar ? (
                <AvatarImage src={l.user.avatar} alt={displayName(l.user)} />
              ) : null}
              <AvatarFallback>{userInitials(l.user)}</AvatarFallback>
            </Avatar>
            <div className="leading-tight">
              <p className="text-xs font-medium">
                {l.user ? displayName(l.user) : "سیستم"}
              </p>
              {l.user?.username ? (
                <p className="text-[10px] text-muted-foreground" dir="ltr">
                  @{l.user.username}
                </p>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        key: "action",
        header: "عملیات",
        cell: (l) => (
          <Badge variant={ACTION_VARIANT[l.action] ?? "outline"}>
            {ACTION_LABEL[l.action] ?? l.action}
          </Badge>
        ),
      },
      {
        key: "entity",
        header: "موضوع",
        cell: (l) => (
          <div className="leading-tight">
            <p className="text-xs">{ENTITY_LABEL[l.entity] ?? l.entity}</p>
            {l.entityId != null ? (
              <code className="text-[10px] text-muted-foreground" dir="ltr">
                #{l.entityId}
              </code>
            ) : null}
          </div>
        ),
      },
      {
        key: "ip",
        header: "آدرس",
        cell: (l) => (
          <span className="text-[10px] text-muted-foreground" dir="ltr">
            {l.ip ?? "—"}
          </span>
        ),
      },
      {
        key: "createdAt",
        header: "زمان",
        cell: (l) => (
          <div className="leading-tight">
            <p className="text-xs">{formatRelativeTime(l.createdAt)}</p>
            <p className="text-[10px] text-muted-foreground">
              {formatDateTime(l.createdAt)}
            </p>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <DataTable<AuditLog>
        data={data?.data ?? []}
        total={data?.meta.total}
        page={page}
        perPage={data?.meta.limit ?? 20}
        onPageChange={setPage}
        loading={loading}
        columns={columns}
        filters={
          <>
            <Select
              value={entity}
              onValueChange={(v) => {
                setEntity(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="موضوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه موضوع‌ها</SelectItem>
                {Object.entries(ENTITY_LABEL).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={action}
              onValueChange={(v) => {
                setAction(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="عملیات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه عملیات</SelectItem>
                {Object.entries(ACTION_LABEL).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              className="w-36"
              aria-label="از تاریخ"
            />
            <Input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              className="w-36"
              aria-label="تا تاریخ"
            />
          </>
        }
        rowActions={(l) => (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setSelected(l)}
            aria-label="مشاهده جزئیات"
          >
            <Eye />
          </Button>
        )}
        emptyTitle="رویدادی یافت نشد"
        emptyDescription="هیچ رویداد لاگ‌شده‌ای با فیلترهای فعلی مطابقت ندارد."
      />

      <AuditDetailSheet
        log={selected}
        open={selected !== null}
        onOpenChange={(v) => !v && setSelected(null)}
      />
    </>
  );
}

function AuditDetailSheet({
  log,
  open,
  onOpenChange,
}: {
  log: AuditLog | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-xl">
        {log ? (
          <>
            <SheetHeader>
              <SheetTitle>جزئیات رویداد</SheetTitle>
              <SheetDescription>
                {ACTION_LABEL[log.action] ?? log.action} روی{" "}
                {ENTITY_LABEL[log.entity] ?? log.entity}
                {log.entityId != null ? ` #${log.entityId}` : ""}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-3 text-sm">
              <Row label="کاربر" value={log.user ? displayName(log.user) : "سیستم"} />
              <Row
                label="نام کاربری"
                value={log.user?.username ?? "—"}
                dir="ltr"
              />
              <Row label="عملیات" value={ACTION_LABEL[log.action] ?? log.action} />
              <Row label="موضوع" value={ENTITY_LABEL[log.entity] ?? log.entity} />
              <Row label="شناسه موضوع" value={String(log.entityId ?? "—")} dir="ltr" />
              <Row label="آدرس IP" value={log.ip ?? "—"} dir="ltr" />
              <Row label="مرورگر" value={log.userAgent ?? "—"} dir="ltr" />
              <Row label="زمان" value={formatDateTime(log.createdAt)} />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <JsonBlock title="قبل" data={log.oldData} />
              <JsonBlock title="بعد" data={log.newData} />
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value, dir }: { label: string; value: string; dir?: "ltr" | "rtl" }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-1.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium" dir={dir}>
        {value}
      </span>
    </div>
  );
}

function JsonBlock({
  title,
  data,
}: {
  title: string;
  data: Record<string, unknown> | null;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-2 text-[11px] font-medium text-muted-foreground">{title}</p>
      {data ? (
        <pre
          className="max-h-72 overflow-auto rounded-md bg-muted/40 p-2 text-[10px] leading-5"
          dir="ltr"
        >
{JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <p className="text-xs text-muted-foreground">—</p>
      )}
    </div>
  );
}
