"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FormInput,
  FormSelect,
  FormSwitch,
  FormTextarea,
  FormRichEditor,
} from "@/components/forms";
import { MediaField } from "@/features/media/media-field";
import {
  categoriesService,
  flattenTree,
  indentedLabel,
} from "@/services/categories.service";
import { parseApiError } from "@/lib/api-error";
import { slugify, toPersianDigits } from "@/lib/format";
import { MAX_CATEGORY_DEPTH, type CategoryNode } from "@/types";

const URL_LIKE = /^(https?:\/\/|\/)/;
const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Radix Select forbids empty-string item values, so the "no parent" option
 *  uses this sentinel which we map back to `null` on submit. */
const ROOT_VALUE = "__root__";

const STATUS_OPTIONS = [
  { value: "active", label: "فعال" },
  { value: "hidden", label: "مخفی" },
  { value: "archived", label: "بایگانی شده" },
] as const;

const optionalStr = z.string().max(20000).optional().or(z.literal(""));
const optionalUrl = z
  .string()
  .max(500)
  .regex(URL_LIKE, "باید آدرس معتبر باشد")
  .optional()
  .or(z.literal(""));

const schema = z.object({
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
  shortDescription: z.string().max(200).optional().or(z.literal("")),
  description: optionalStr,
  icon: z.string().max(100).optional().or(z.literal("")),
  coverImage: optionalUrl,
  color: z.string().regex(HEX, "رنگ HEX، مثل #1e88e5").optional().or(z.literal("")),
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

type Props = {
  /** Edit mode — id of the category being edited. Omit for create mode. */
  id?: number;
  /** Optional preset parent for create mode (set via `?parentId=` on /new). */
  parentId?: number;
};

/**
 * Standalone full-page form for create/edit of a category. Replaces the
 * earlier `<CategoryFormDialog>` so editors get a dedicated workspace with
 * the rich editor for the long description — same as the article create
 * flow, so the editing experience is consistent across content types.
 *
 * Routes:
 *   /categories/new            → create
 *   /categories/new?parentId=X → create as child of X
 *   /categories/[id]/edit      → edit
 */
export function CategoryForm({ id, parentId: presetParentId }: Props) {
  const router = useRouter();
  const isEdit = typeof id === "number" && Number.isFinite(id);

  const [tree, setTree] = React.useState<CategoryNode[]>([]);
  const [loading, setLoading] = React.useState(isEdit);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // The full list of descendant ids of the edited node — we forbid choosing
  // them as parent to prevent loops. Populated after the edited node loads.
  const [blockedIds, setBlockedIds] = React.useState<Set<number>>(new Set());

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  // Auto-fill slug from name only in create mode (don't clobber an existing
  // slug — that would break shareable category URLs).
  const name = methods.watch("name");
  React.useEffect(() => {
    if (isEdit || !name) return;
    methods.setValue("slug", slugify(name));
  }, [name, isEdit, methods]);

  // Load the category tree (for the parent select) once on mount.
  React.useEffect(() => {
    let cancelled = false;
    categoriesService
      .listTree()
      .then((t) => {
        if (!cancelled) setTree(t);
      })
      .catch(() => {
        /* leave the parent select empty — root-only is still useful */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the editing target.
  React.useEffect(() => {
    if (!isEdit) {
      methods.reset({
        ...DEFAULTS,
        parentId:
          typeof presetParentId === "number"
            ? String(presetParentId)
            : ROOT_VALUE,
      });
      return;
    }
    let cancelled = false;
    setLoading(true);
    categoriesService
      .get(id!)
      .then((cat) => {
        if (cancelled) return;
        methods.reset({
          name: cat.name,
          slug: cat.slug ?? "",
          parentId: cat.parentId ? String(cat.parentId) : ROOT_VALUE,
          status: cat.status,
          isFeatured: cat.isFeatured,
          sortOrder: String(cat.sortOrder ?? 0),
          shortDescription: cat.shortDescription ?? "",
          description: cat.description ?? "",
          icon: cat.icon ?? "",
          coverImage: cat.coverImage ?? "",
          color: cat.color ?? "",
          metaTitle: cat.metaTitle ?? "",
          metaDescription: cat.metaDescription ?? "",
          metaKeywords: cat.metaKeywords ?? "",
          ogImage: cat.ogImage ?? "",
          canonicalUrl: cat.canonicalUrl ?? "",
          noIndex: cat.noIndex,
        });
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError(parseApiError(e).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // We intentionally don't include `methods` — `useForm` is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit, presetParentId]);

  // Collect the edited node's descendants from the tree so we can hide them
  // from the parent select. Without this, an editor could pin a category
  // under one of its own children → cycle.
  React.useEffect(() => {
    if (!isEdit || tree.length === 0) {
      setBlockedIds(new Set());
      return;
    }
    const blocked = new Set<number>();
    const visit = (node: CategoryNode) => {
      blocked.add(node.id);
      node.children?.forEach(visit);
    };
    const find = (nodes: CategoryNode[]): CategoryNode | null => {
      for (const n of nodes) {
        if (n.id === id) return n;
        const inChild = find(n.children ?? []);
        if (inChild) return inChild;
      }
      return null;
    };
    const target = find(tree);
    if (target) visit(target);
    setBlockedIds(blocked);
  }, [tree, id, isEdit]);

  const parentOptions = React.useMemo(() => {
    const flat = flattenTree(tree);
    return [
      { label: "— ریشه (بدون والد)", value: ROOT_VALUE },
      ...flat
        .filter(
          (n) => !blockedIds.has(n.id) && n.depth < MAX_CATEGORY_DEPTH,
        )
        .map((n) => ({ label: indentedLabel(n), value: String(n.id) })),
    ];
  }, [tree, blockedIds]);

  const onSubmit = methods.handleSubmit(async (values) => {
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
    try {
      if (isEdit) {
        await categoriesService.update(id!, payload);
        toast.success("دسته بروزرسانی شد");
      } else {
        await categoriesService.create(payload);
        toast.success("دسته ایجاد شد");
      }
      router.push("/categories");
      // Force the list page to revalidate so the new/updated row appears.
      router.refresh();
    } catch (e) {
      toast.error(parseApiError(e).message);
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        <Loader2 className="me-2 size-4 animate-spin" />
        در حال بارگذاری دسته…
      </div>
    );
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="space-y-3 py-8 text-center">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/categories">
              <ArrowLeft className="size-4" />
              بازگشت به لیست
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="space-y-4" dir="rtl">
        <Tabs dir="rtl" defaultValue="general" className="flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">عمومی</TabsTrigger>
            <TabsTrigger value="display">نمایش</TabsTrigger>
            <TabsTrigger value="seo">سئو</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-3 outline-none">
            <Card>
              <CardContent className="space-y-3 pt-5">
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
                  hint={`حداکثر ۲۰۰ کاراکتر — برای نمایش در کارت‌ها و فهرست‌ها. تا ${toPersianDigits(
                    MAX_CATEGORY_DEPTH,
                  )} لایه تو در تو پشتیبانی می‌شود.`}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="display" className="space-y-3 outline-none">
            <Card>
              <CardContent className="space-y-3 pt-5">
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
                    hint="HEX — برای border/badge ها استفاده می‌شود"
                  />
                </div>
                <FormRichEditor<Values>
                  name="description"
                  label="توضیحات کامل"
                  hint="در صفحهٔ عمومی دسته، در باکس سئو «درباره {نام دسته}» نمایش داده می‌شود."
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo" className="space-y-3 outline-none">
            <Card>
              <CardContent className="space-y-3 pt-5">
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Sticky action bar — keeps Save reachable when the long description
            pushes the page well below the viewport. */}
        <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-end gap-2 rounded-xl border border-border bg-card/95 p-3 shadow-elevated backdrop-blur">
          <Button asChild variant="outline" size="sm">
            <Link href="/categories">
              <ArrowLeft className="size-4" />
              بازگشت
            </Link>
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={methods.formState.isSubmitting}
          >
            {methods.formState.isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isEdit ? "ذخیره تغییرات" : "ایجاد دسته"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
