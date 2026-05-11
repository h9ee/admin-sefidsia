"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Edit, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/tables/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FormInput } from "@/components/forms/form-input";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { usePermission } from "@/hooks/use-permission";
import { tagsService } from "@/services/tags.service";
import { parseApiError } from "@/lib/api-error";
import { formatNumber, slugify } from "@/lib/format";
import type { Paginated, Tag } from "@/types";

const schema = z.object({
  name: z.string().min(1, "نام الزامی است"),
  slug: z.string().min(1, "شناسه الزامی است"),
});
type Values = z.infer<typeof schema>;

export function TagsList() {
  const { can } = usePermission();
  const [data, setData] = useState<Paginated<Tag> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [reload, setReload] = useState(0);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    tagsService
      .list({ page, perPage: 12, search })
      .then((res) => active && setData(res))
      .catch(() => active && setData({ data: [], meta: { total: 0, page, perPage: 12, totalPages: 1 } }))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, search, reload]);

  const columns = useMemo<Column<Tag>[]>(
    () => [
      {
        key: "name",
        header: "نام",
        cell: (t) => (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t.name}</span>
            <code className="text-[11px] text-muted-foreground" dir="ltr">
              {t.slug}
            </code>
          </div>
        ),
      },
      {
        key: "count",
        header: "استفاده",
        cell: (t) =>
          t.count != null ? <Badge variant="muted">{formatNumber(t.count)}</Badge> : "—",
      },
    ],
    [],
  );

  return (
    <>
      <DataTable<Tag>
        data={data?.data ?? []}
        total={data?.meta.total}
        page={page}
        perPage={data?.meta.perPage ?? 12}
        onPageChange={setPage}
        search={search}
        onSearch={(q) => {
          setSearch(q);
          setPage(1);
        }}
        searchPlaceholder="جستجو در برچسب‌ها…"
        loading={loading}
        columns={columns}
        toolbar={
          <PermissionGuard permission="tags.create">
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus />
              برچسب جدید
            </Button>
          </PermissionGuard>
        }
        rowActions={(t) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {can("tags.update") ? (
                <DropdownMenuItem
                  onSelect={() => {
                    setEditing(t);
                    setOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                  ویرایش
                </DropdownMenuItem>
              ) : null}
              {can("tags.delete") ? (
                <ConfirmDialog
                  title={`حذف ${t.name}؟`}
                  destructive
                  confirmLabel="حذف"
                  onConfirm={async () => {
                    try {
                      await tagsService.remove(t.id);
                      setReload((x) => x + 1);
                      toast.success("برچسب حذف شد");
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

      <TagFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        onSaved={() => setReload((x) => x + 1)}
      />
    </>
  );
}

function TagFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Tag | null;
  onSaved: () => void;
}) {
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "" },
  });

  useEffect(() => {
    methods.reset({ name: editing?.name ?? "", slug: editing?.slug ?? "" });
  }, [editing, methods, open]);

  const name = methods.watch("name");
  useEffect(() => {
    if (!editing && name) methods.setValue("slug", slugify(name));
  }, [name, editing, methods]);

  const onSubmit = methods.handleSubmit(async (values) => {
    try {
      if (editing) {
        await tagsService.update(editing.id, values);
        toast.success("برچسب بروزرسانی شد");
      } else {
        await tagsService.create(values);
        toast.success("برچسب ایجاد شد");
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(parseApiError(e).message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <span hidden />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "ویرایش برچسب" : "برچسب جدید"}</DialogTitle>
          <DialogDescription>
            هر برچسب می‌تواند به مقالات و سوالات مرتبط متصل شود.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          <form onSubmit={onSubmit} className="space-y-3">
            <FormInput<Values> name="name" label="نام" required />
            <FormInput<Values> name="slug" label="شناسه" dir="ltr" required />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                انصراف
              </Button>
              <Button type="submit" disabled={methods.formState.isSubmitting}>
                ذخیره
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
