"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Edit,
  GitMerge,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/cn";
import type { Paginated, Tag, TagStatus } from "@/types";

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

const STATUS_FILTERS: { value: TagStatus | "all"; label: string }[] = [
  { value: "all", label: "همه" },
  { value: "pending", label: "در انتظار تایید" },
  { value: "approved", label: "تایید‌شده" },
];

export function TagsList() {
  const { can } = usePermission();
  const [data, setData] = useState<Paginated<Tag> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TagStatus | "all">("all");
  const [reload, setReload] = useState(0);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [open, setOpen] = useState(false);
  const [mergingFrom, setMergingFrom] = useState<Tag | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    tagsService
      .list({
        page,
        limit: 12,
        q: search || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      })
      .then((res) => active && setData(res))
      .catch(() =>
        active &&
        setData({ data: [], meta: { page, limit: 12, total: 0, totalPages: 1 } }),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, search, statusFilter, reload]);

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
        key: "status",
        header: "وضعیت",
        cell: (t) =>
          t.status === "pending" ? (
            <Badge variant="warning">در انتظار تایید</Badge>
          ) : (
            <Badge variant="success">تایید‌شده</Badge>
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
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(s.value);
                    setPage(1);
                  }}
                  className={cn(
                    "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors",
                    statusFilter === s.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-foreground/80 hover:bg-accent",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
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
          </div>
        }
        rowActions={(t) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {can("tags.manage") && t.status === "pending" ? (
                <DropdownMenuItem
                  onSelect={async () => {
                    try {
                      await tagsService.approve(t.id);
                      setReload((x) => x + 1);
                      toast.success("برچسب تایید شد");
                    } catch (e) {
                      toast.error(parseApiError(e).message);
                    }
                  }}
                >
                  <Check className="h-4 w-4 text-emerald-600" />
                  تایید برچسب
                </DropdownMenuItem>
              ) : null}
              {can("tags.manage") ? (
                <DropdownMenuItem onSelect={() => setMergingFrom(t)}>
                  <GitMerge className="h-4 w-4" />
                  ادغام در برچسب دیگر…
                </DropdownMenuItem>
              ) : null}
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

      <MergeTagDialog
        source={mergingFrom}
        onOpenChange={(v) => !v && setMergingFrom(null)}
        onMerged={() => {
          setMergingFrom(null);
          setReload((x) => x + 1);
        }}
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
      // `slug` is auto-generated server-side when omitted, so undefined =
      // "leave the slug alone (or auto-generate on create)". `description`
      // however is user-clearable: empty must be sent as `null` so the
      // backend column is actually cleared. Sending `undefined` drops the
      // field and the partial PATCH treats it as "no change".
      const optionalSlug = (v?: string) =>
        v && v.length > 0 ? v : undefined;
      const nullableDescription = (v?: string) =>
        v && v.length > 0 ? v : null;
      if (editing) {
        await tagsService.update(editing.id, {
          name: values.name,
          slug: optionalSlug(values.slug),
          description: nullableDescription(values.description),
        });
        toast.success("برچسب بروزرسانی شد");
      } else {
        await tagsService.create({
          name: values.name,
          slug: optionalSlug(values.slug),
          description: nullableDescription(values.description),
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

/* ------------------------------------------------------------------ */
/*  Merge dialog                                                       */
/* ------------------------------------------------------------------ */

function MergeTagDialog({
  source,
  onOpenChange,
  onMerged,
}: {
  source: Tag | null;
  onOpenChange: (v: boolean) => void;
  onMerged: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Tag[]>([]);
  const [picked, setPicked] = useState<Tag | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset when (re)opened on a different source.
  useEffect(() => {
    setQ("");
    setResults([]);
    setPicked(null);
  }, [source?.id]);

  // Debounced search for merge target — excludes the source itself.
  useEffect(() => {
    const term = q.trim();
    if (!term || !source) {
      setResults([]);
      return;
    }
    setSearching(true);
    const handle = setTimeout(() => {
      tagsService
        .list({ q: term, limit: 10, status: "approved" })
        .then((res) =>
          setResults(res.data.filter((t) => String(t.id) !== String(source.id))),
        )
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [q, source]);

  if (!source) return null;

  const submit = async () => {
    if (!picked) return;
    setSubmitting(true);
    try {
      await tagsService.merge(source.id, picked.id);
      toast.success(
        `«${source.name}» در «${picked.name}» ادغام شد و حذف گردید.`,
      );
      onMerged();
    } catch (e) {
      toast.error(parseApiError(e).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!source} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-4 w-4" />
            ادغام «{source.name}»
          </DialogTitle>
          <DialogDescription>
            همه استفاده‌ها از این برچسب به برچسب مقصد منتقل و خود این برچسب
            حذف می‌شود. این عمل قابل بازگشت نیست.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="merge-target">جستجوی برچسب مقصد</Label>
          <Input
            id="merge-target"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPicked(null);
            }}
            placeholder="مثلاً: قلب و عروق"
            autoFocus
          />
          {q.trim() && (
            <div className="max-h-64 overflow-y-auto rounded-md border border-border">
              {searching ? (
                <p className="p-3 text-xs text-muted-foreground">
                  در حال جستجو…
                </p>
              ) : results.length === 0 ? (
                <p className="p-3 text-xs text-muted-foreground">
                  نتیجه‌ای یافت نشد.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {results.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setPicked(t)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition-colors",
                          picked?.id === t.id
                            ? "bg-primary/10 text-foreground"
                            : "hover:bg-accent",
                        )}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span className="font-medium">{t.name}</span>
                          <code
                            className="text-[10px] text-muted-foreground"
                            dir="ltr"
                          >
                            {t.slug}
                          </code>
                        </span>
                        {t.usageCount != null && t.usageCount > 0 ? (
                          <span className="text-[10px] text-muted-foreground">
                            {formatNumber(t.usageCount)} استفاده
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {picked ? (
            <p className="rounded-md bg-muted px-3 py-2 text-xs">
              ادغام در: <span className="font-medium">{picked.name}</span>
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            انصراف
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={submit}
            disabled={!picked || submitting}
          >
            <GitMerge className="h-4 w-4" />
            ادغام و حذف
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
