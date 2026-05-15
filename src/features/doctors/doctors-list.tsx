"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Eye, MoreHorizontal, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { DataTable, type Column } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePermission } from "@/hooks/use-permission";
import { doctorsService } from "@/services/doctors.service";
import { parseApiError } from "@/lib/api-error";
import { formatNumber, toPersianDigits } from "@/lib/format";
import { displayName, userInitials } from "@/lib/user";
import type { Doctor, DoctorVerificationStatus, Paginated } from "@/types";

export function DoctorsList() {
  const { can } = usePermission();
  const [data, setData] = useState<Paginated<Doctor> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<DoctorVerificationStatus | "all">("all");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    doctorsService
      .list({
        page,
        limit: 10,
        q: search || undefined,
        verificationStatus: status === "all" ? undefined : status,
      })
      .then((res) => active && setData(res))
      .catch(() =>
        active &&
        setData({ data: [], meta: { page, limit: 10, total: 0, totalPages: 1 } }),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, search, status, reload]);

  const columns = useMemo<Column<Doctor>[]>(
    () => [
      {
        key: "doctor",
        header: "پزشک",
        cell: (d) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {d.user?.avatar ? (
                <AvatarImage src={d.user.avatar} alt={displayName(d.user)} />
              ) : null}
              <AvatarFallback>{userInitials(d.user)}</AvatarFallback>
            </Avatar>
            <div className="leading-tight">
              <Link href={`/doctors/${d.id}`} className="text-sm font-medium hover:underline">
                {displayName(d.user)}
              </Link>
              <p className="text-[11px] text-muted-foreground">
                {d.specialty} · کد نظام پزشکی {toPersianDigits(d.medicalCode)}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "stats",
        header: "آمار",
        cell: (d) => (
          <div className="flex flex-wrap gap-1">
            <Badge variant="muted">{formatNumber(d.answerCount)} پاسخ</Badge>
            <Badge variant="muted">
              {formatNumber(d.approvedArticleCount)} مقاله
            </Badge>
            <Badge variant="outline">
              امتیاز {toPersianDigits(d.rankScore.toFixed(0))}
            </Badge>
          </div>
        ),
      },
      {
        key: "status",
        header: "وضعیت",
        cell: (d) => <StatusBadge status={d.verificationStatus} />,
      },
    ],
    [],
  );

  return (
    <DataTable<Doctor>
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
      searchPlaceholder="جستجو در پزشکان…"
      loading={loading}
      columns={columns}
      filters={
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as DoctorVerificationStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
            <SelectItem value="pending">در انتظار تایید</SelectItem>
            <SelectItem value="approved">تایید شده</SelectItem>
            <SelectItem value="rejected">رد شده</SelectItem>
          </SelectContent>
        </Select>
      }
      rowActions={(d) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/doctors/${d.id}`}>
                <Eye className="h-4 w-4" />
                مشاهده پروفایل
              </Link>
            </DropdownMenuItem>
            {can("doctors.verify") && d.verificationStatus !== "approved" ? (
              <ConfirmDialog
                title={`تایید ${displayName(d.user)}؟`}
                description="پس از تایید، پزشک می‌تواند به‌صورت رسمی فعالیت کند."
                confirmLabel="تایید پزشک"
                onConfirm={async () => {
                  try {
                    await doctorsService.verify(d.id, "approved");
                    setReload((x) => x + 1);
                    toast.success("پزشک تایید شد");
                  } catch (e) {
                    toast.error(parseApiError(e).message);
                  }
                }}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Check className="h-4 w-4" />
                    تایید
                  </DropdownMenuItem>
                }
              />
            ) : null}
            {can("doctors.verify") && d.verificationStatus !== "rejected" ? (
              <ConfirmDialog
                title={`رد درخواست ${displayName(d.user)}؟`}
                description="درخواست تایید این پزشک رد خواهد شد."
                destructive
                confirmLabel="رد درخواست"
                onConfirm={async () => {
                  try {
                    await doctorsService.verify(d.id, "rejected");
                    setReload((x) => x + 1);
                    toast.success("درخواست رد شد");
                  } catch (e) {
                    toast.error(parseApiError(e).message);
                  }
                }}
                trigger={
                  <DropdownMenuItem destructive onSelect={(e) => e.preventDefault()}>
                    <X className="h-4 w-4" />
                    رد
                  </DropdownMenuItem>
                }
              />
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  );
}
