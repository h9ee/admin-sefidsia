"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Edit, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { DataTable, type Column } from "@/components/tables/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { usePermission } from "@/hooks/use-permission";
import { rolesService } from "@/services/roles.service";
import { parseApiError } from "@/lib/api-error";
import { formatNumber } from "@/lib/format";
import type { Role } from "@/types";

export function RolesList() {
  const { can } = usePermission();
  const [data, setData] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    rolesService
      .list()
      .then((res) => {
        if (active) setData(res.data);
      })
      .catch(() => active && setData([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reload]);

  const columns = useMemo<Column<Role>[]>(
    () => [
      {
        key: "name",
        header: "نقش",
        cell: (r) => (
          <div className="leading-tight">
            <Link href={`/roles/${r.id}`} className="text-sm font-medium hover:underline">
              {r.name}
            </Link>
            <p className="text-[11px] text-muted-foreground">{r.slug}</p>
          </div>
        ),
      },
      {
        key: "description",
        header: "توضیح",
        cell: (r) => <span className="text-xs text-muted-foreground">{r.description || "—"}</span>,
      },
      {
        key: "permissions",
        header: "دسترسی‌ها",
        cell: (r) => (
          <Badge variant="muted">{formatNumber(r.permissions.length)} مورد</Badge>
        ),
      },
      {
        key: "users",
        header: "کاربران",
        cell: (r) =>
          r.usersCount != null ? formatNumber(r.usersCount) : <span className="text-xs text-muted-foreground">—</span>,
      },
      {
        key: "system",
        header: "سیستمی",
        cell: (r) =>
          r.isSystem ? (
            <Badge variant="outline">سیستمی</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
    ],
    [],
  );

  return (
    <DataTable<Role>
      data={data}
      loading={loading}
      columns={columns}
      toolbar={
        <PermissionGuard permission="roles.create">
          <Button asChild>
            <Link href="/roles/new">
              <Plus />
              نقش جدید
            </Link>
          </Button>
        </PermissionGuard>
      }
      rowActions={(r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {can("roles.update") ? (
              <DropdownMenuItem asChild>
                <Link href={`/roles/${r.id}`}>
                  <Edit className="h-4 w-4" />
                  ویرایش
                </Link>
              </DropdownMenuItem>
            ) : null}
            {can("roles.delete") && !r.isSystem ? (
              <ConfirmDialog
                title={`حذف نقش ${r.name}؟`}
                description="کاربرانی که این نقش را دارند، آن را از دست خواهند داد."
                confirmLabel="حذف"
                destructive
                onConfirm={async () => {
                  try {
                    await rolesService.remove(r.id);
                    setReload((x) => x + 1);
                    toast.success("نقش حذف شد");
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
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  );
}
