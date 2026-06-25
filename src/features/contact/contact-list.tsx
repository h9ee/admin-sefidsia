"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Trash2, Eye, EyeOff, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/tables/data-table";
import { contactService } from "@/services/contact.service";
import { parseApiError } from "@/lib/api-error";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import type {
  ContactMessage,
  ContactReadFilter,
  Paginated,
} from "@/types";

export function ContactList() {
  const [data, setData] = useState<Paginated<ContactMessage> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [read, setRead] = useState<ContactReadFilter>("all");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(q.trim()), 250);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    contactService
      .list({ page, limit: 10, read, q: search || undefined })
      .then((res) => active && setData(res))
      .catch(() =>
        active &&
        setData({
          data: [],
          meta: { page, limit: 10, total: 0, totalPages: 1 },
        }),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, read, search, reload]);

  async function toggleRead(row: ContactMessage, next: boolean) {
    try {
      await contactService.setRead(row.id, next);
      setReload((x) => x + 1);
      toast.success(
        next ? "به‌عنوان خوانده‌شده ثبت شد" : "به‌عنوان خوانده‌نشده ثبت شد",
      );
    } catch (e) {
      toast.error(parseApiError(e).message);
    }
  }

  async function remove(row: ContactMessage) {
    if (!window.confirm("پیام حذف شود؟")) return;
    try {
      await contactService.remove(row.id);
      setReload((x) => x + 1);
      toast.success("پیام حذف شد");
    } catch (e) {
      toast.error(parseApiError(e).message);
    }
  }

  const columns = useMemo<Column<ContactMessage>[]>(
    () => [
      {
        key: "isRead",
        header: "خوانده‌شده",
        width: "80px",
        cell: (r) => (
          <div
            className="flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={r.isRead}
              onCheckedChange={(v) => toggleRead(r, v === true)}
              aria-label="علامت‌گذاری به‌عنوان خوانده‌شده"
            />
          </div>
        ),
      },
      {
        key: "subject",
        header: "موضوع و فرستنده",
        cell: (r) => (
          <button
            type="button"
            onClick={() => {
              setSelected(r);
              if (!r.isRead) toggleRead(r, true);
            }}
            className="text-right"
          >
            <p
              className={`text-sm ${r.isRead ? "font-medium" : "font-bold"}`}
            >
              {r.subject}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {r.name}{" "}
              <span dir="ltr" className="ms-1 inline-block">
                <Phone className="inline size-3" /> {r.mobile}
              </span>
            </p>
          </button>
        ),
      },
      {
        key: "message",
        header: "پیام",
        cell: (r) => (
          <p className="line-clamp-2 max-w-md text-xs text-muted-foreground">
            {r.message}
          </p>
        ),
      },
      {
        key: "status",
        header: "وضعیت",
        cell: (r) =>
          r.isRead ? (
            <Badge variant="outline">خوانده‌شده</Badge>
          ) : (
            <Badge className="bg-rose-500 hover:bg-rose-600 text-white">
              جدید
            </Badge>
          ),
      },
      {
        key: "createdAt",
        header: "زمان",
        cell: (r) => (
          <span
            className="text-xs text-muted-foreground"
            title={formatDateTime(r.createdAt)}
          >
            {formatRelativeTime(r.createdAt)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <DataTable<ContactMessage>
        data={data?.data ?? []}
        total={data?.meta.total}
        page={page}
        perPage={data?.meta.limit ?? 10}
        onPageChange={setPage}
        loading={loading}
        columns={columns}
        search={q}
        onSearch={(v) => {
          setQ(v);
          setPage(1);
        }}
        searchPlaceholder="جستجو در نام، موبایل، موضوع یا متن…"
        filters={
          <Select
            value={read}
            onValueChange={(v) => {
              setRead(v as ContactReadFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="وضعیت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه پیام‌ها</SelectItem>
              <SelectItem value="unread">خوانده‌نشده</SelectItem>
              <SelectItem value="read">خوانده‌شده</SelectItem>
            </SelectContent>
          </Select>
        }
        rowActions={(r) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelected(r)}>
                <Eye className="h-4 w-4" /> مشاهده کامل
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleRead(r, !r.isRead)}>
                {r.isRead ? (
                  <>
                    <EyeOff className="h-4 w-4" /> خوانده‌نشده
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" /> خوانده‌شده
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => remove(r)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" /> حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.subject}</DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-muted/50 p-3 text-xs">
                <p>
                  <span className="text-muted-foreground">فرستنده: </span>
                  <span className="font-medium">{selected.name}</span>
                </p>
                <p className="mt-1">
                  <span className="text-muted-foreground">موبایل: </span>
                  <a
                    href={`tel:${selected.mobile}`}
                    dir="ltr"
                    className="font-medium text-primary hover:underline"
                  >
                    {selected.mobile}
                  </a>
                </p>
                <p className="mt-1">
                  <span className="text-muted-foreground">تاریخ: </span>
                  <span>{formatDateTime(selected.createdAt)}</span>
                </p>
              </div>
              <div className="whitespace-pre-line text-sm leading-7">
                {selected.message}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    toggleRead(selected, !selected.isRead);
                    setSelected({ ...selected, isRead: !selected.isRead });
                  }}
                >
                  {selected.isRead ? "علامت خوانده‌نشده" : "علامت خوانده‌شده"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    remove(selected);
                    setSelected(null);
                  }}
                >
                  <Trash2 className="size-4" /> حذف
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
