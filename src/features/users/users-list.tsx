"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Edit, MoreHorizontal, ShieldOff, ShieldCheck, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePermission } from "@/hooks/use-permission";
import { usersService } from "@/services/users.service";
import { parseApiError } from "@/lib/api-error";
import { formatDate } from "@/lib/format";
import { displayName, userInitials } from "@/lib/user";
import type { Paginated, User, UserStatus, UserType } from "@/types";

export function UsersList() {
  const { can } = usePermission();
  const [data, setData] = useState<Paginated<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<UserStatus | "all">("all");
  const [userType, setUserType] = useState<UserType | "all">("all");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    usersService
      .list({
        page,
        limit: 10,
        q: search || undefined,
        status: status === "all" ? undefined : status,
        userType: userType === "all" ? undefined : userType,
      })
      .then((res) => {
        if (active) setData(res);
      })
      .catch(() =>
        active &&
        setData({ data: [], meta: { page, limit: 10, total: 0, totalPages: 1 } }),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, search, status, userType, reload]);

  const columns = useMemo<Column<User>[]>(
    () => [
      {
        key: "user",
        header: "کاربر",
        cell: (u) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {u.avatar ? <AvatarImage src={u.avatar} alt={displayName(u)} /> : null}
              <AvatarFallback>{userInitials(u)}</AvatarFallback>
            </Avatar>
            <div className="leading-tight">
              <Link href={`/users/${u.id}`} className="text-sm font-medium hover:underline">
                {displayName(u)}
              </Link>
              <p className="text-[11px] text-muted-foreground" dir="ltr">
                @{u.username}{u.email ? ` · ${u.email}` : ""}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "type",
        header: "نوع",
        cell: (u) => (
          <span className="text-xs text-muted-foreground">
            {u.userType === "doctor" ? "پزشک" : u.userType === "admin" ? "ادمین" : "عادی"}
          </span>
        ),
      },
      {
        key: "roles",
        header: "نقش",
        cell: (u) => (
          <div className="flex flex-wrap gap-1">
            {u.roles?.length ? (
              u.roles.map((r) => (
                <span
                  key={r.id}
                  className="rounded-full border border-border px-2 py-0.5 text-[11px]"
                >
                  {r.name}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        ),
      },
      {
        key: "status",
        header: "وضعیت",
        cell: (u) => <StatusBadge status={u.status} />,
      },
      {
        key: "createdAt",
        header: "تاریخ عضویت",
        sortable: true,
        cell: (u) => (
          <span className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</span>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable<User>
      data={data?.data ?? []}
      total={data?.meta.total}
      page={page}
      perPage={data?.meta.limit ?? 10}
      onPageChange={setPage}
      search={search}
      onSearch={(q) => {
        setSearch(q);
        setPage(1);
      }}
      searchPlaceholder="جستجو در کاربران…"
      loading={loading}
      columns={columns}
      filters={
        <>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as UserStatus | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="وضعیت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه وضعیت‌ها</SelectItem>
              <SelectItem value="active">فعال</SelectItem>
              <SelectItem value="pending">در انتظار</SelectItem>
              <SelectItem value="blocked">مسدود</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={userType}
            onValueChange={(v) => {
              setUserType(v as UserType | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="نوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه</SelectItem>
              <SelectItem value="normal">عادی</SelectItem>
              <SelectItem value="doctor">پزشک</SelectItem>
              <SelectItem value="admin">ادمین</SelectItem>
            </SelectContent>
          </Select>
        </>
      }
      rowActions={(u) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="عملیات">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {can("users.update") ? (
              <DropdownMenuItem asChild>
                <Link href={`/users/${u.id}`}>
                  <Edit className="h-4 w-4" />
                  ویرایش
                </Link>
              </DropdownMenuItem>
            ) : null}
            {can("users.update") ? (
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await usersService.setStatus(
                      u.id,
                      u.status === "active" ? "blocked" : "active",
                    );
                    setReload((r) => r + 1);
                    toast.success("وضعیت کاربر بروزرسانی شد");
                  } catch (e) {
                    toast.error(parseApiError(e).message);
                  }
                }}
              >
                {u.status === "active" ? (
                  <>
                    <ShieldOff className="h-4 w-4" />
                    مسدود کردن
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    فعال‌سازی
                  </>
                )}
              </DropdownMenuItem>
            ) : null}
            {can("users.delete") ? (
              <>
                <DropdownMenuSeparator />
                <ConfirmDialog
                  title={`حذف ${displayName(u)}؟`}
                  description="با حذف این کاربر تمامی داده‌های مرتبط حذف خواهد شد."
                  confirmLabel="حذف"
                  destructive
                  onConfirm={async () => {
                    try {
                      await usersService.remove(u.id);
                      setReload((r) => r + 1);
                      toast.success("کاربر حذف شد");
                    } catch (e) {
                      toast.error(parseApiError(e).message);
                    }
                  }}
                  trigger={
                    <DropdownMenuItem destructive onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="h-4 w-4" />
                      حذف
                    </DropdownMenuItem>
                  }
                />
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      emptyTitle="کاربری یافت نشد"
      emptyDescription="با جستجو یا تغییر فیلترها دوباره تلاش کنید."
    />
  );
}
