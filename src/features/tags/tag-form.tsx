"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormInput } from "@/components/forms/form-input";
import { FormTextarea } from "@/components/forms/form-textarea";
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

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات پایه</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormInput<Values> name="name" label="نام" required />
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
                hint="مسیر صفحه عمومی برچسب — در صورت خالی بودن، همان slug استفاده می‌شود."
                dir="ltr"
                placeholder="diabetes-type-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توضیحات</CardTitle>
          </CardHeader>
          <CardContent>
            <FormRichEditor<Values>
              name="description"
              placeholder="توضیح کوتاهی درباره این برچسب بنویسید — این متن در بالای صفحه عمومی برچسب نمایش داده می‌شود."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>سئو</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              این مقادیر بر مقادیر پیش‌فرض (نام و توضیحات) در صفحه عمومی برچسب
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
            <MediaField<Values>
              name="ogImage"
              label="تصویر اشتراک‌گذاری (Open Graph)"
              kind="image"
              hint="تصویر اختصاصی برای نمایش در شبکه‌های اجتماعی هنگام اشتراک لینک این برچسب."
            />
          </CardContent>
        </Card>

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
