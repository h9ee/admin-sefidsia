"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronLeft,
  Edit,
  EyeOff,
  FolderTree,
  ImageIcon,
  MoreHorizontal,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSwitch } from "@/components/forms/form-switch";
import { MediaField } from "@/features/media/media-field";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { usePermission } from "@/hooks/use-permission";
import {
  categoriesService,
  flattenTree,
  indentedLabel,
} from "@/services/categories.service";
import { parseApiError } from "@/lib/api-error";
import { formatNumber, slugify, toPersianDigits } from "@/lib/format";
import { mediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/cn";
import { MAX_CATEGORY_DEPTH, type CategoryNode } from "@/types";

const STATUS_OPTIONS = [
  { value: "active", label: "فعال" },
  { value: "hidden", label: "مخفی" },
  { value: "archived", label: "بایگانی شده" },
] as const;

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "muted" | "outline" }> = {
  active: { label: "فعال", variant: "default" },
  hidden: { label: "مخفی", variant: "muted" },
  archived: { label: "بایگانی", variant: "outline" },
};

const URL_LIKE = /^(https?:\/\/|\/)/;
const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Radix Select forbids empty-string item values, so the "no parent" option
 *  uses this sentinel which we map back to `null` on submit. */
const ROOT_VALUE = "__root__";

const optionalStr = z.string().max(20000).optional().or(z.literal(""));
const optionalUrl = z
  .string()
  .max(500)
  .regex(URL_LIKE, "باید آدرس معتبر باشد")
  .optional()
  .or(z.literal(""));

const schema = z.object({
  // Basic
  name: z.string().min(2, "نام الزامی است").max(120),
  slug: z
    .string()
    .min(2)
    .max(160)
    .regex(/^[a-z0-9-]+$/, "فقط حروف کوچک انگلیسی، عدد و -")
    .optional()
    .or(z.literal("")),
  parentId: z.string(),
  status: z.enum(["active", "hidden", "archived"]),
  isFeatured: z.boolean(),
  sortOrder: z
    .string()
    .regex(/^\d+$/, "فقط عدد")
    .refine((v) => Number(v) <= 99999, "حداکثر ۹۹۹۹۹"),

  // Display
  shortDescription: z.string().max(200).optional().or(z.literal("")),
  description: optionalStr,
  icon: z.string().max(100).optional().or(z.literal("")),
  coverImage: optionalUrl,
  color: z.string().regex(HEX, "رنگ HEX، مثل #1e88e5").optional().or(z.literal("")),

  // SEO
  metaTitle: z.string().max(200).optional().or(z.literal("")),
  metaDescription: z.string().max(320).optional().or(z.literal("")),
  metaKeywords: z.string().max(500).optional().or(z.literal("")),
  ogImage: optionalUrl,
  canonicalUrl: optionalUrl,
  noIndex: z.boolean(),
});
type Values = z.infer<typeof schema>;

const DEFAULTS: Values = {
  name: "",
  slug: "",
  parentId: ROOT_VALUE,
  status: "active",
  isFeatured: false,
  sortOrder: "0",
  shortDescription: "",
  description: "",
  icon: "",
  coverImage: "",
  color: "",
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  ogImage: "",
  canonicalUrl: "",
  noIndex: false,
};

export function CategoriesTree() {
  const { can } = usePermission();
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CategoryNode | null>(null);
  const [presetParent, setPresetParent] = useState<CategoryNode | null>(null);
  const [open, setOpen] = useState(false);

  const load = () => {
    setLoading(true);
    categoriesService
      .listTree()
      .then((t) => setTree(t))
      .catch((e) => toast.error(parseApiError(e).message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const flat = flattenTree(tree);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              ساختار دسته‌بندی
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              حداکثر تا {toPersianDigits(MAX_CATEGORY_DEPTH)} لایه تو در تو
            </p>
          </div>
          <PermissionGuard permission="categories.manage">
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setPresetParent(null);
                setOpen(true);
              }}
            >
              <Plus />
              دسته ریشه
            </Button>
          </PermissionGuard>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-xs text-muted-foreground">در حال بارگذاری…</p>
          ) : tree.length === 0 ? (
            <EmptyState
              className="border-0"
              title="هیچ دسته‌ای ثبت نشده"
              description="برای شروع، یک دسته ریشه ایجاد کنید."
            />
          ) : (
            <div className="space-y-1">
              {tree.map((n) => (
                <Branch
                  key={n.id}
                  node={n}
                  canManage={can("categories.manage")}
                  onAddChild={(parent) => {
                    setEditing(null);
                    setPresetParent(parent);
                    setOpen(true);
                  }}
                  onEdit={(node) => {
                    setEditing(node);
                    setPresetParent(null);
                    setOpen(true);
                  }}
                  onRemoved={load}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CategoryFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        presetParent={presetParent}
        flat={flat}
        onSaved={load}
      />
    </>
  );
}

function Branch({
  node,
  canManage,
  onAddChild,
  onEdit,
  onRemoved,
}: {
  node: CategoryNode;
  canManage: boolean;
  onAddChild: (parent: CategoryNode) => void;
  onEdit: (node: CategoryNode) => void;
  onRemoved: () => void;
}) {
  const [expanded, setExpanded] = useState(node.depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const atMaxDepth = node.depth >= MAX_CATEGORY_DEPTH;
  const statusInfo = STATUS_BADGE[node.status] ?? STATUS_BADGE.active;

  return (
    <div className={cn(node.depth > 1 && "ms-5 border-r border-border ps-3")}>
      <div className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/40">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded text-muted-foreground",
            !hasChildren && "invisible",
          )}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Thumbnail / color dot */}
        {node.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(node.coverImage)}
            alt=""
            className="h-7 w-7 shrink-0 rounded-md object-cover ring-1 ring-border"
          />
        ) : node.color ? (
          <span
            className="h-3 w-3 shrink-0 rounded-full ring-1 ring-border"
            style={{ backgroundColor: node.color }}
            aria-hidden
          />
        ) : (
          <ImageIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
        )}

        <div className="flex flex-1 flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{node.name}</span>
          <code className="text-[10px] text-muted-foreground" dir="ltr">
            {node.slug}
          </code>
          <Badge variant="outline" className="text-[10px]">
            لایه {toPersianDigits(node.depth)}
          </Badge>
          <Badge variant={statusInfo.variant} className="text-[10px]">
            {statusInfo.label}
          </Badge>
          {node.isFeatured ? (
            <Badge variant="muted" className="gap-1 text-[10px]">
              <Star className="h-2.5 w-2.5" />
              ویژه
            </Badge>
          ) : null}
          {node.noIndex ? (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <EyeOff className="h-2.5 w-2.5" />
              noindex
            </Badge>
          ) : null}
          {node.articleCount != null && node.articleCount > 0 ? (
            <Badge variant="muted" className="text-[10px]">
              {formatNumber(node.articleCount)} مقاله
            </Badge>
          ) : null}
        </div>

        {canManage ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="عملیات">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!atMaxDepth ? (
                <DropdownMenuItem onClick={() => onAddChild(node)}>
                  <Plus className="h-4 w-4" />
                  افزودن زیردسته
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={() => onEdit(node)}>
                <Edit className="h-4 w-4" />
                ویرایش
              </DropdownMenuItem>
              <ConfirmDialog
                title={`حذف ${node.name}؟`}
                description="اگر این دسته دارای زیردسته یا مقاله باشد، حذف انجام نمی‌شود."
                destructive
                confirmLabel="حذف"
                onConfirm={async () => {
                  try {
                    await categoriesService.remove(node.id);
                    onRemoved();
                    toast.success("دسته حذف شد");
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
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      {expanded && hasChildren ? (
        <div className="mt-0.5 space-y-1">
          {node.children.map((child) => (
            <Branch
              key={child.id}
              node={child}
              canManage={canManage}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onRemoved={onRemoved}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CategoryFormDialog({
  open,
  onOpenChange,
  editing,
  presetParent,
  flat,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: CategoryNode | null;
  presetParent: CategoryNode | null;
  flat: CategoryNode[];
  onSaved: () => void;
}) {
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      methods.reset({
        name: editing.name,
        slug: editing.slug,
        parentId: editing.parentId ? String(editing.parentId) : ROOT_VALUE,
        status: editing.status,
        isFeatured: editing.isFeatured,
        sortOrder: String(editing.sortOrder),
        shortDescription: editing.shortDescription ?? "",
        description: editing.description ?? "",
        icon: editing.icon ?? "",
        coverImage: editing.coverImage ?? "",
        color: editing.color ?? "",
        metaTitle: editing.metaTitle ?? "",
        metaDescription: editing.metaDescription ?? "",
        metaKeywords: editing.metaKeywords ?? "",
        ogImage: editing.ogImage ?? "",
        canonicalUrl: editing.canonicalUrl ?? "",
        noIndex: editing.noIndex,
      });
    } else {
      methods.reset({
        ...DEFAULTS,
        parentId: presetParent ? String(presetParent.id) : ROOT_VALUE,
      });
    }
  }, [editing, presetParent, open, methods]);

  // Auto-fill slug from name only when creating (don't clobber existing slug).
  const name = methods.watch("name");
  useEffect(() => {
    if (!editing && name) methods.setValue("slug", slugify(name));
  }, [name, editing, methods]);

  // Forbid moving a node under its own descendant.
  const blockedIds = new Set<number>();
  if (editing) {
    const collect = (node: CategoryNode) => {
      blockedIds.add(node.id);
      node.children?.forEach(collect);
    };
    collect(editing);
  }
  const parentOptions = [
    { label: "— ریشه (بدون والد)", value: ROOT_VALUE },
    ...flat
      .filter((n) => !blockedIds.has(n.id) && n.depth < MAX_CATEGORY_DEPTH)
      .map((n) => ({ label: indentedLabel(n), value: String(n.id) })),
  ];

  const onSubmit = methods.handleSubmit(async (values) => {
    try {
      const empty = (s: string | undefined) =>
        s && s.length > 0 ? s : null;
      const payload = {
        name: values.name,
        slug: values.slug && values.slug.length > 0 ? values.slug : undefined,
        parentId:
          values.parentId && values.parentId !== ROOT_VALUE
            ? Number(values.parentId)
            : null,
        status: values.status,
        isFeatured: values.isFeatured,
        sortOrder: Number(values.sortOrder),
        shortDescription: empty(values.shortDescription),
        description: empty(values.description),
        icon: empty(values.icon),
        coverImage: empty(values.coverImage),
        color: empty(values.color),
        metaTitle: empty(values.metaTitle),
        metaDescription: empty(values.metaDescription),
        metaKeywords: empty(values.metaKeywords),
        ogImage: empty(values.ogImage),
        canonicalUrl: empty(values.canonicalUrl),
        noIndex: values.noIndex,
      };
      if (editing) {
        await categoriesService.update(editing.id, payload);
        toast.success("دسته بروزرسانی شد");
      } else {
        await categoriesService.create(payload);
        toast.success("دسته ایجاد شد");
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(parseApiError(e).message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Force RTL on the whole dialog. The admin layout direction sometimes
          inherits LTR (from a parent that locked it for code/URL inputs), and
          the category form is Persian-content-first — name, descriptions,
          help text. Without an explicit `dir`, labels and text flow into
          the wrong side and tab indicators land on the wrong edge. */}
      <DialogContent
        dir="rtl"
        className="max-h-[90vh] overflow-hidden text-start sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>{editing ? "ویرایش دسته" : "دسته جدید"}</DialogTitle>
          <DialogDescription>
            تا {toPersianDigits(MAX_CATEGORY_DEPTH)} لایه تو در تو پشتیبانی می‌شود.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4 overflow-hidden">
            <Tabs defaultValue="general" className="flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">عمومی</TabsTrigger>
                <TabsTrigger value="display">نمایش</TabsTrigger>
                <TabsTrigger value="seo">سئو</TabsTrigger>
              </TabsList>

              <div className="mt-3 max-h-[55vh] overflow-y-auto pe-1">
                <TabsContent value="general" className="space-y-3 outline-none">
                  <FormInput<Values> name="name" label="نام" required />
                  <FormInput<Values>
                    name="slug"
                    label="شناسه (slug)"
                    hint="فقط حروف کوچک انگلیسی، عدد و خط تیره. اگر خالی باشد، خودکار از نام ساخته می‌شود."
                    dir="ltr"
                  />
                  <FormSelect<Values>
                    name="parentId"
                    label="دسته والد"
                    options={parentOptions}
                    placeholder="انتخاب کنید"
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormSelect<Values>
                      name="status"
                      label="وضعیت"
                      options={STATUS_OPTIONS.map((o) => ({
                        value: o.value,
                        label: o.label,
                      }))}
                    />
                    <FormInput<Values>
                      name="sortOrder"
                      label="ترتیب نمایش"
                      type="number"
                      hint="عدد کوچک‌تر = اولویت بالاتر"
                    />
                  </div>
                  <FormSwitch<Values>
                    name="isFeatured"
                    label="دسته ویژه (نمایش در صفحات خاص)"
                  />
                  <FormTextarea<Values>
                    name="shortDescription"
                    label="توضیح کوتاه"
                    rows={2}
                    hint="حداکثر ۲۰۰ کاراکتر — برای نمایش در کارت‌ها و فهرست‌ها."
                  />
                </TabsContent>

                <TabsContent value="display" className="space-y-3 outline-none">
                  <MediaField<Values>
                    name="coverImage"
                    label="تصویر شاخص"
                    kind="image"
                    hint="ابعاد پیشنهادی: ۱۲۰۰×۶۳۰"
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormInput<Values>
                      name="icon"
                      label="آیکن (lucide name یا URL)"
                      dir="ltr"
                      hint="مثل heart, brain یا یک آدرس SVG"
                    />
                    <FormInput<Values>
                      name="color"
                      label="رنگ شاخص"
                      placeholder="#1e88e5"
                      dir="ltr"
                      hint="HEX — برای bordr/badge ها استفاده می‌شود"
                    />
                  </div>
                  <FormTextarea<Values>
                    name="description"
                    label="توضیحات کامل"
                    rows={6}
                    hint="می‌توانید HTML/Markdown ساده استفاده کنید."
                  />
                </TabsContent>

                <TabsContent value="seo" className="space-y-3 outline-none">
                  <FormInput<Values>
                    name="metaTitle"
                    label="عنوان سئو (Meta Title)"
                    hint="پیشنهاد: ۵۰–۶۰ کاراکتر"
                  />
                  <FormTextarea<Values>
                    name="metaDescription"
                    label="توضیح سئو (Meta Description)"
                    rows={3}
                    hint="پیشنهاد: ۱۵۰–۱۶۰ کاراکتر"
                  />
                  <FormInput<Values>
                    name="metaKeywords"
                    label="کلمات کلیدی"
                    hint="با ویرگول جدا کنید"
                  />
                  <MediaField<Values>
                    name="ogImage"
                    label="تصویر Open Graph"
                    kind="image"
                    hint="نسبت پیشنهادی ۱.۹:۱ — استفاده در اشتراک شبکه‌های اجتماعی"
                  />
                  <FormInput<Values>
                    name="canonicalUrl"
                    label="آدرس Canonical"
                    dir="ltr"
                    placeholder="https://… یا /…"
                  />
                  <FormSwitch<Values>
                    name="noIndex"
                    label="عدم index توسط موتورهای جستجو"
                  />
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="border-t border-border pt-3">
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
