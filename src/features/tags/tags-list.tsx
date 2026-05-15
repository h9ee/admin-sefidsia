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
import { FormTextarea } from "@/components/forms/form-textarea";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { usePermission } from "@/hooks/use-permission";
import { tagsService } from "@/services/tags.service";
import { parseApiError } from "@/lib/api-error";
import { formatNumber, slugify } from "@/lib/format";
import type { Paginated, Tag } from "@/types";

const schema = z.object({
  name: z.string().min(2, "نام الزامی است").max(80),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "فقط حروف کوچک انگلیسی، عدد و -")
    .optional()
    .or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
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
      .list({ page, limit: 12, q: search || undefined })
      .then((res) => active && setData(res))
      .catch(() =>
        active &&
        setData({ data: [], meta: { page, limit: 12, total: 0, totalPages: 1 } }),
      )
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
        key: "description",
        header: "توضیح",
        cell: (t) => (
          <span className="line-clamp-1 text-xs text-muted-foreground">
            {t.description ?? "—"}
          </span>
        ),
      },
      {
        key: "usageCount",
        header: "استفاده",
        cell: (t) =>
          t.usageCount != null ? <Badge variant="muted">{formatNumber(t.usageCount)}</Badge> : "—",
      },
      {
        key: "followerCount",
        header: "دنبال‌کنندگان",
        cell: (t) =>
          t.followerCount != null
            ? <Badge variant="outline">{formatNumber(t.followerCount)}</Badge>
            : "—",
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
        perPage={data?.meta.limit ?? 12}
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
          <PermissionGuard permission="tags.manage">
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
              {can("tags.manage") ? (
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
              {can("tags.manage") ? (
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
    defaultValues: { name: "", slug: "", description: "" },
  });

  useEffect(() => {
    methods.reset({
      name: editing?.name ?? "",
      slug: editing?.slug ?? "",
      description: editing?.description ?? "",
    });
  }, [editing, methods, open]);

  const name = methods.watch("name");
  useEffect(() => {
    if (!editing && name) methods.setValue("slug", slugify(name));
  }, [name, editing, methods]);

  const onSubmit = methods.handleSubmit(async (values) => {
    try {
      const clean = (v?: string) => (v && v.length > 0 ? v : undefined);
      if (editing) {
        await tagsService.update(editing.id, {
          name: values.name,
          slug: clean(values.slug),
          description: clean(values.description),
        });
        toast.success("برچسب بروزرسانی شد");
      } else {
        await tagsService.create({
          name: values.name,
          slug: clean(values.slug),
          description: clean(values.description),
        });
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
            <FormInput<Values>
              name="slug"
              label="شناسه (اختیاری)"
              hint="در صورت خالی بودن، خودکار از نام تولید می‌شود."
              dir="ltr"
            />
            <FormTextarea<Values> name="description" label="توضیحات" rows={2} />
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
