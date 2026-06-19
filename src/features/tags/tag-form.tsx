"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowRight,
  EyeOff,
  Globe,
  Hash,
  Image as ImageIcon,
  Info,
  Loader2,
  Save,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormInput } from "@/components/forms/form-input";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSelect } from "@/components/forms/form-select";
import { FormRichEditor } from "@/components/forms/form-rich-editor";
import { MediaField } from "@/features/media";
import { tagsService } from "@/services/tags.service";
import { parseApiError } from "@/lib/api-error";
import { slugify } from "@/lib/format";
import type { Tag } from "@/types";

/* ---------------------------- Schema ---------------------------- */

const slugRegex = /^[a-z0-9-]+$/;
const slugMsg = "فقط حروف کوچک انگلیسی، عدد و -";

const schema = z.object({
  name: z.string().min(2, "نام الزامی است").max(80),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(slugRegex, slugMsg)
    .optional()
    .or(z.literal("")),
  url: z
    .string()
    .min(2)
    .max(160)
    .regex(slugRegex, slugMsg)
    .optional()
    .or(z.literal("")),
  description: z.string().max(30_000).optional().or(z.literal("")),
  seoTitle: z.string().max(160).optional().or(z.literal("")),
  seoDescription: z.string().max(255).optional().or(z.literal("")),
  ogImage: z.string().max(500).optional().or(z.literal("")),
  ogImageAlt: z.string().max(255).optional().or(z.literal("")),
  // `status` is editable only by users with `tags.manage`; the backend
  // already enforces this on /tags/:id PATCH. The form's <FormSelect> lets
  // the admin flip a `pending` tag straight to `approved` without going
  // through the separate /approve endpoint.
  status: z.enum(["approved", "pending"]),
});
type Values = z.infer<typeof schema>;

/* ---------------------------- Helpers ---------------------------- */

/** `undefined` = leave unchanged on PATCH; we collapse empty strings to it
 *  for create-side "auto-generate this" slots (slug, url). */
const optional = (v?: string) => (v && v.length > 0 ? v : undefined);
/** Explicit clear: empty becomes `null` so the column is wiped. */
const nullable = (v?: string) => (v && v.length > 0 ? v : null);

/* ---------------------------- Component ---------------------------- */

interface Props {
  /** When set → edit mode. When null → create mode. */
  editing: Tag | null;
}

/**
 * Full-page tag form. Used by /tags/new and /tags/[id]/edit. Saves through
 * `tagsService` and routes back to /tags on success.
 *
 * Shared with both create and edit screens — same schema, same fields, same
 * auto-sync behaviour. The only thing that differs is what `editing` carries.
 */
export function TagForm({ editing }: Props) {
  const router = useRouter();
  const isEdit = !!editing;

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: editing?.name ?? "",
      slug: editing?.slug ?? "",
      // Fall back to the technical slug so legacy rows (created before the
      // `url` column existed) show something sensible in the field.
      url: editing?.url ?? editing?.slug ?? "",
      description: editing?.description ?? "",
      seoTitle: editing?.seoTitle ?? "",
      seoDescription: editing?.seoDescription ?? "",
      ogImage: editing?.ogImage ?? "",
      ogImageAlt: editing?.ogImageAlt ?? "",
      status: editing?.status ?? "approved",
    },
  });

  // Auto-derive slug + url from the name on CREATE only. We never overwrite an
  // editor's existing URL on update — that would silently break inbound links.
  const name = methods.watch("name");
  useEffect(() => {
    if (isEdit || !name) return;
    const s = slugify(name);
    methods.setValue("slug", s);
    if (!methods.getValues("url")) methods.setValue("url", s);
  }, [name, isEdit, methods]);

  const onSubmit = methods.handleSubmit(async (values) => {
    try {
      const payload = {
        name: values.name,
        slug: optional(values.slug),
        url: optional(values.url),
        description: nullable(values.description),
        seoTitle: nullable(values.seoTitle),
        seoDescription: nullable(values.seoDescription),
        ogImage: nullable(values.ogImage),
        ogImageAlt: nullable(values.ogImageAlt),
        status: values.status,
      };

      if (editing) {
        await tagsService.update(editing.id, payload);
        toast.success("برچسب بروزرسانی شد");
      } else {
        await tagsService.create(payload);
        toast.success("برچسب ایجاد شد");
      }
      router.push("/tags");
      router.refresh();
    } catch (e) {
      toast.error(parseApiError(e).message);
    }
  });

  // Live values that drive the small sidebar preview — keeps the editor's
  // intent visible without leaving the page.
  const watchedName = methods.watch("name");
  const watchedUrl = methods.watch("url");
  const watchedSlug = methods.watch("slug");
  const watchedStatus = methods.watch("status");
  const watchedImage = methods.watch("ogImage");
  const watchedAlt = methods.watch("ogImageAlt");
  const previewPath = `/tags/${watchedUrl || watchedSlug || "—"}`;

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          {/* ─────────────── LEFT: main content ─────────────── */}
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Hash className="size-4 text-muted-foreground" />
                  اطلاعات پایه
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <FormInput<Values>
                  name="name"
                  label="نام"
                  required
                  placeholder="فارسی، خوانا و قابل جست‌وجو"
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormInput<Values>
                    name="slug"
                    label="شناسه فنی (slug)"
                    hint="در صورت خالی بودن، خودکار از نام تولید می‌شود."
                    dir="ltr"
                    placeholder="diabetes-type-2"
                  />
                  <FormInput<Values>
                    name="url"
                    label="URL عمومی (یکتا)"
                    hint="مسیر صفحهٔ عمومی برچسب — در صورت خالی، همان slug استفاده می‌شود."
                    dir="ltr"
                    placeholder="diabetes-type-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Info className="size-4 text-muted-foreground" />
                  توضیحات (HTML)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormRichEditor<Values>
                  name="description"
                  placeholder="توضیح کوتاهی درباره این برچسب بنویسید — این متن در بالای صفحهٔ عمومی برچسب نمایش داده می‌شود."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Search className="size-4 text-muted-foreground" />
                  سئو
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  این مقادیر بر مقادیر پیش‌فرض (نام و توضیحات) در صفحهٔ عمومی برچسب
                  اولویت دارند.
                </p>
                <FormInput<Values>
                  name="seoTitle"
                  label="عنوان سئو"
                  hint="حداکثر ۱۶۰ کاراکتر. خالی بگذارید تا از نام برچسب استفاده شود."
                />
                <FormTextarea<Values>
                  name="seoDescription"
                  label="توضیحات متا (meta description)"
                  rows={3}
                  hint="حداکثر ۲۵۵ کاراکتر."
                />
              </CardContent>
            </Card>
          </div>

          {/* ─────────────── RIGHT: sidebar ─────────────── */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="size-4 text-muted-foreground" />
                  وضعیت انتشار
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* تگ‌های پیشنهادی کاربر معمولی با وضعیت `pending` می‌آیند و تا
                    وقتی approved نشوند در ناوبری‌های عمومی نمایش داده نمی‌شوند. */}
                <FormSelect<Values>
                  name="status"
                  options={[
                    { label: "تأیید شده — قابل نمایش در سایت", value: "approved" },
                    { label: "در انتظار بازبینی — مخفی از عموم", value: "pending" },
                  ]}
                />
                {/* بازخورد بصری وضعیت فعلی، یک نگاه و کافی است. */}
                <div className="flex items-center gap-2 text-xs">
                  {watchedStatus === "approved" ? (
                    <Badge variant="success" className="gap-1">
                      <ShieldCheck className="size-3" />
                      روی سایت قابل نمایش
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="gap-1">
                      <EyeOff className="size-3" />
                      مخفی از عموم
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ImageIcon className="size-4 text-muted-foreground" />
                  تصویر بنر
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* MediaField → MediaPicker ⇒ هم آپلود مستقیم، هم انتخاب از کتابخانه. */}
                <MediaField<Values>
                  name="ogImage"
                  kind="image"
                  hint="در بالای صفحهٔ عمومی برچسب به‌عنوان بنر، و هنگام اشتراک‌گذاری در شبکه‌های اجتماعی نمایش داده می‌شود."
                />
                <FormInput<Values>
                  name="ogImageAlt"
                  label="متن جایگزین (alt)"
                  hint="برای دسترس‌پذیری و سئو. اگر خالی بماند، از نام برچسب استفاده می‌شود."
                />
              </CardContent>
            </Card>

            {/* پیش‌نمایش زندهٔ صفحهٔ عمومی — همان طرح هدر در /tags/[slug] */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="size-4 text-muted-foreground" />
                  پیش‌نمایش
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                  {watchedImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={watchedImage}
                      alt={watchedAlt || watchedName || "بنر برچسب"}
                      className="aspect-21/9 w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-21/9 w-full items-center justify-center text-xs text-muted-foreground">
                      بدون تصویر بنر
                    </div>
                  )}
                  <div className="flex items-start gap-2 p-3">
                    <Hash className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {watchedName || "نام برچسب"}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground" dir="ltr">
                        {previewPath}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sticky save bar — همان الگوی فرم مقاله. */}
        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-lg border border-border bg-card/95 p-3 shadow-soft backdrop-blur">
          <Button asChild type="button" variant="outline">
            <Link href="/tags">
              <ArrowRight />
              بازگشت به فهرست
            </Link>
          </Button>
          <Button type="submit" disabled={methods.formState.isSubmitting}>
            {methods.formState.isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEdit ? "ذخیره تغییرات" : "ایجاد برچسب"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
