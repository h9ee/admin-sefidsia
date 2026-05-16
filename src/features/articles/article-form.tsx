"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  FileText,
  ImageIcon,
  ListChecks,
  Save,
  Send,
  Share2,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FormInput,
  FormTextarea,
  FormMultiSelect,
  FormSelect,
  FormSwitch,
  FormRichEditor,
  FormStringList,
  FormFaqEditor,
  FormReferencesEditor,
  FormDoctorSelect,
  FormDateTimePicker,
} from "@/components/forms";
import { MediaField } from "@/features/media";
import { articlesService } from "@/services/articles.service";
import { tagsService } from "@/services/tags.service";
import {
  categoriesService,
  flattenTree,
  indentedLabel,
} from "@/services/categories.service";
import { parseApiError } from "@/lib/api-error";
import type {
  CategoryNode,
  ContentType,
  AudienceLevel,
  AudienceAge,
  ContentWarning,
  Tag,
  TwitterCardType,
} from "@/types";

/* ---------------------------- Schema ---------------------------- */

const faqItemSchema = z.object({
  question: z.string().min(5, "حداقل ۵ کاراکتر"),
  answer: z.string().min(5, "حداقل ۵ کاراکتر"),
});

const referenceItemSchema = z.object({
  title: z.string().min(2, "عنوان منبع الزامی است"),
  url: z.string().url("URL معتبر نیست").optional().or(z.literal("")),
  doi: z.string().optional().or(z.literal("")),
  pmid: z
    .string()
    .regex(/^\d*$/, "PMID باید عدد باشد")
    .optional()
    .or(z.literal("")),
  authors: z.string().optional().or(z.literal("")),
  year: z.number().int().optional(),
  publisher: z.string().optional().or(z.literal("")),
});

const schema = z.object({
  // Core
  title: z.string().min(5, "عنوان حداقل ۵ کاراکتر است"),
  subtitle: z.string().max(300).optional().or(z.literal("")),
  summary: z.string().max(500).optional().or(z.literal("")),
  content: z.string().min(50, "محتوا حداقل ۵۰ کاراکتر است"),
  coverImage: z.string().optional().or(z.literal("")),
  coverImageAlt: z.string().max(255).optional().or(z.literal("")),

  // Taxonomy
  categoryId: z.string().min(1, "انتخاب دسته‌بندی الزامی است"),
  tagIds: z.array(z.string()),

  // Classification
  contentType: z.enum([
    "guide",
    "news",
    "explainer",
    "research_summary",
    "opinion",
    "case_study",
  ]),
  audienceLevel: z.enum(["general", "patient", "caregiver", "professional"]),
  audienceAge: z.enum(["all", "children", "teen", "adult", "senior"]),
  contentWarning: z.enum([
    "none",
    "medical_advice_required",
    "sensitive",
    "urgent",
    "graphic",
  ]),
  disclaimer: z.string().max(2000).optional().or(z.literal("")),

  // Engagement
  allowComments: z.boolean(),
  allowReactions: z.boolean(),
  isFeatured: z.boolean(),

  // Rich blocks
  keyTakeaways: z.array(z.string()),
  faq: z.array(faqItemSchema),
  references: z.array(referenceItemSchema),

  // SEO
  seoTitle: z.string().max(160).optional().or(z.literal("")),
  seoDescription: z.string().max(255).optional().or(z.literal("")),
  canonicalUrl: z.string().url().optional().or(z.literal("")),
  focusKeyword: z.string().max(120).optional().or(z.literal("")),

  // Social
  ogTitle: z.string().max(160).optional().or(z.literal("")),
  ogDescription: z.string().max(255).optional().or(z.literal("")),
  ogImage: z.string().optional().or(z.literal("")),
  twitterCard: z.enum(["summary", "summary_large_image"]).nullable(),

  // Medical review
  reviewedByDoctorId: z.number().int().positive().nullable(),
  requireMedicalReview: z.boolean(),

  // Scheduling
  scheduledAt: z.string().nullable(),
});

type Values = z.infer<typeof schema>;

/* ---------------------------- Options ---------------------------- */

const CONTENT_TYPE_OPTIONS: { label: string; value: ContentType }[] = [
  { label: "راهنما", value: "guide" },
  { label: "خبر", value: "news" },
  { label: "توضیحی", value: "explainer" },
  { label: "خلاصه پژوهشی", value: "research_summary" },
  { label: "تحلیلی / نظر", value: "opinion" },
  { label: "مطالعه موردی", value: "case_study" },
];

const AUDIENCE_LEVEL_OPTIONS: { label: string; value: AudienceLevel }[] = [
  { label: "عمومی", value: "general" },
  { label: "بیمار", value: "patient" },
  { label: "مراقبت‌کننده", value: "caregiver" },
  { label: "حرفه‌ای / پزشک", value: "professional" },
];

const AUDIENCE_AGE_OPTIONS: { label: string; value: AudienceAge }[] = [
  { label: "همه سنین", value: "all" },
  { label: "کودکان", value: "children" },
  { label: "نوجوانان", value: "teen" },
  { label: "بزرگسالان", value: "adult" },
  { label: "سالمندان", value: "senior" },
];

const CONTENT_WARNING_OPTIONS: { label: string; value: ContentWarning }[] = [
  { label: "هیچ هشداری ندارد", value: "none" },
  {
    label: "نیاز به نظر پزشک شخصی",
    value: "medical_advice_required",
  },
  { label: "محتوای حساس", value: "sensitive" },
  { label: "محتوای اورژانس", value: "urgent" },
  { label: "محتوای تصویری ناخوشایند", value: "graphic" },
];

const TWITTER_CARD_OPTIONS: { label: string; value: TwitterCardType }[] = [
  { label: "خلاصه", value: "summary" },
  { label: "خلاصه با تصویر بزرگ", value: "summary_large_image" },
];

/* ---------------------------- Component ---------------------------- */

export function ArticleForm({ slug }: { slug?: string }) {
  const isEdit = !!slug;
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [articleId, setArticleId] = useState<string | null>(null);

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      subtitle: "",
      summary: "",
      content: "",
      coverImage: "",
      coverImageAlt: "",
      categoryId: "",
      tagIds: [],

      contentType: "guide",
      audienceLevel: "general",
      audienceAge: "all",
      contentWarning: "none",
      disclaimer: "",

      allowComments: true,
      allowReactions: true,
      isFeatured: false,

      keyTakeaways: [],
      faq: [],
      references: [],

      seoTitle: "",
      seoDescription: "",
      canonicalUrl: "",
      focusKeyword: "",

      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      twitterCard: null,

      reviewedByDoctorId: null,
      requireMedicalReview: false,

      scheduledAt: null,
    },
  });

  useEffect(() => {
    tagsService
      .list({ limit: 100 })
      .then((res) => setTags(res.data))
      .catch(() => undefined);
    categoriesService
      .listTree()
      .then((t) => setTree(t))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!slug) return;
    articlesService
      .getBySlug(slug)
      .then((a) => {
        setArticleId(a.id);
        methods.reset({
          title: a.title,
          subtitle: a.subtitle ?? "",
          summary: a.summary ?? "",
          content: a.content,
          coverImage: a.coverImage ?? "",
          coverImageAlt: a.coverImageAlt ?? "",
          categoryId: a.categoryId != null ? String(a.categoryId) : "",
          tagIds: (a.tags ?? []).map((t) => t.id),

          contentType: a.contentType ?? "guide",
          audienceLevel: a.audienceLevel ?? "general",
          audienceAge: a.audienceAge ?? "all",
          contentWarning: a.contentWarning ?? "none",
          disclaimer: a.disclaimer ?? "",

          allowComments: a.allowComments ?? true,
          allowReactions: a.allowReactions ?? true,
          isFeatured: a.isFeatured ?? false,

          keyTakeaways: a.keyTakeaways ?? [],
          faq: a.faq ?? [],
          references: a.references ?? [],

          seoTitle: a.seoTitle ?? "",
          seoDescription: a.seoDescription ?? "",
          canonicalUrl: a.canonicalUrl ?? "",
          focusKeyword: a.focusKeyword ?? "",

          ogTitle: a.ogTitle ?? "",
          ogDescription: a.ogDescription ?? "",
          ogImage: a.ogImage ?? "",
          twitterCard: a.twitterCard ?? null,

          reviewedByDoctorId: a.reviewedByDoctorId
            ? Number(a.reviewedByDoctorId)
            : null,
          requireMedicalReview: a.medicalReviewStatus !== "not_required",

          scheduledAt: a.scheduledAt ?? null,
        });
      })
      .catch((e) => toast.error(parseApiError(e).message));
  }, [slug, methods]);

  const categoryOptions = useMemo(
    () =>
      flattenTree(tree).map((n) => ({
        label: indentedLabel(n),
        value: String(n.id),
      })),
    [tree],
  );

  const submit = (publishAfter?: boolean) =>
    methods.handleSubmit(async (values) => {
      try {
        const clean = (v?: string | null) =>
          v && v.length > 0 ? v : undefined;
        const cleanArr = <T,>(arr: T[]) => (arr.length > 0 ? arr : undefined);

        const payload = {
          title: values.title,
          subtitle: clean(values.subtitle),
          summary: clean(values.summary),
          content: values.content,
          coverImage: clean(values.coverImage),
          coverImageAlt: clean(values.coverImageAlt),

          categoryId: Number(values.categoryId),
          tagIds: values.tagIds,

          contentType: values.contentType,
          audienceLevel: values.audienceLevel,
          audienceAge: values.audienceAge,
          contentWarning: values.contentWarning,
          disclaimer: clean(values.disclaimer),

          allowComments: values.allowComments,
          allowReactions: values.allowReactions,
          isFeatured: values.isFeatured,

          keyTakeaways: cleanArr(
            values.keyTakeaways.map((s) => s.trim()).filter(Boolean),
          ),
          faq: cleanArr(
            values.faq.filter(
              (f) => f.question.trim() && f.answer.trim(),
            ),
          ),
          references: cleanArr(
            values.references.filter((r) => r.title.trim()),
          ),

          seoTitle: clean(values.seoTitle),
          seoDescription: clean(values.seoDescription),
          canonicalUrl: clean(values.canonicalUrl),
          focusKeyword: clean(values.focusKeyword),

          ogTitle: clean(values.ogTitle),
          ogDescription: clean(values.ogDescription),
          ogImage: clean(values.ogImage),
          twitterCard: values.twitterCard ?? undefined,

          reviewedByDoctorId: values.reviewedByDoctorId ?? null,
          requireMedicalReview: values.requireMedicalReview,

          scheduledAt: values.scheduledAt ?? null,
        };

        const article =
          isEdit && articleId
            ? await articlesService.update(articleId, payload)
            : await articlesService.create(payload);

        if (publishAfter) {
          await articlesService.publish(article.id);
          toast.success(
            article.status === "scheduled"
              ? "مقاله برای انتشار زمان‌بندی شد"
              : "مقاله برای انتشار ارسال شد",
          );
        } else {
          toast.success(isEdit ? "مقاله بروزرسانی شد" : "مقاله ذخیره شد");
        }
        router.push("/articles");
      } catch (e) {
        toast.error(parseApiError(e).message);
      }
    });

  const scheduledAt = methods.watch("scheduledAt");
  const isScheduled =
    scheduledAt && new Date(scheduledAt).getTime() > Date.now();

  return (
    <FormProvider {...methods}>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid gap-4 lg:grid-cols-3">
          {/* ------------------ LEFT (tabs) ------------------ */}
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>محتوای مقاله</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <FormInput<Values>
                  name="title"
                  label="عنوان"
                  required
                  placeholder="عنوان واضح، خاص و قابل جستجو"
                />
                <FormInput<Values>
                  name="subtitle"
                  label="زیر عنوان (lede)"
                  hint="یک جمله جذاب که زیر عنوان نمایش داده می‌شود (اختیاری)."
                />
                <FormTextarea<Values>
                  name="summary"
                  label="چکیده"
                  rows={2}
                  hint="حداکثر ۵۰۰ کاراکتر — برای کارت‌های لیست و meta description پیش‌فرض"
                />
                <FormRichEditor<Values>
                  name="content"
                  label="متن کامل"
                  required
                />
              </CardContent>
            </Card>

            <Tabs defaultValue="highlights">
              <TabsList className="overflow-x-auto no-scrollbar">
                <TabsTrigger value="highlights">
                  <Sparkles className="h-4 w-4" />
                  نکات کلیدی و FAQ
                </TabsTrigger>
                <TabsTrigger value="references">
                  <BookOpen className="h-4 w-4" />
                  منابع علمی
                </TabsTrigger>
                <TabsTrigger value="audience">
                  <ListChecks className="h-4 w-4" />
                  مخاطب و طبقه‌بندی
                </TabsTrigger>
                <TabsTrigger value="seo">
                  <FileText className="h-4 w-4" />
                  سئو و اشتراک‌گذاری
                </TabsTrigger>
              </TabsList>

              {/* Highlights + FAQ */}
              <TabsContent value="highlights">
                <Card>
                  <CardContent className="space-y-5 pt-5">
                    <FormStringList<Values>
                      name="keyTakeaways"
                      label="نکات کلیدی"
                      hint="3 تا 5 نکته اصلی که خواننده باید بداند — در بالای مقاله نمایش داده می‌شوند."
                      max={10}
                      placeholder="یک نکته کلیدی…"
                    />
                    <FormFaqEditor<Values>
                      name="faq"
                      label="پرسش‌های متداول (FAQ)"
                      hint="هر پرسش/پاسخ به‌صورت Rich Snippet در گوگل نمایش داده می‌شود."
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* References */}
              <TabsContent value="references">
                <Card>
                  <CardContent className="space-y-3 pt-5">
                    <FormReferencesEditor<Values>
                      name="references"
                      label="منابع علمی"
                      hint="عنوان منبع الزامی است. سایر فیلدها (نویسنده، DOI، PMID، URL) برای استناد دقیق توصیه می‌شود."
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Audience + Classification + Engagement */}
              <TabsContent value="audience">
                <Card>
                  <CardContent className="space-y-3 pt-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormSelect<Values>
                        name="contentType"
                        label="نوع محتوا"
                        options={CONTENT_TYPE_OPTIONS}
                      />
                      <FormSelect<Values>
                        name="audienceLevel"
                        label="سطح مخاطب"
                        options={AUDIENCE_LEVEL_OPTIONS}
                      />
                      <FormSelect<Values>
                        name="audienceAge"
                        label="رده سنی"
                        options={AUDIENCE_AGE_OPTIONS}
                      />
                      <FormSelect<Values>
                        name="contentWarning"
                        label="هشدار محتوا"
                        options={CONTENT_WARNING_OPTIONS}
                      />
                    </div>
                    <FormTextarea<Values>
                      name="disclaimer"
                      label="پیام عدم مسئولیت اختصاصی"
                      rows={3}
                      hint="در صورت خالی بودن، پیام پیش‌فرض سایت نمایش داده می‌شود."
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <FormSwitch<Values>
                        name="allowComments"
                        label="نمایش دیدگاه‌ها"
                        description="در مقالات حساس می‌توانید غیرفعال کنید."
                      />
                      <FormSwitch<Values>
                        name="allowReactions"
                        label="نمایش واکنش‌ها"
                        description="لایک / واکنش‌های احساسی."
                      />
                      <FormSwitch<Values>
                        name="isFeatured"
                        label="مقاله ویژه"
                        description="در صفحه نخست برجسته شود."
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SEO + Social */}
              <TabsContent value="seo">
                <Card>
                  <CardContent className="space-y-5 pt-5">
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        سئو پایه
                      </h3>
                      <FormInput<Values>
                        name="seoTitle"
                        label="عنوان سئو"
                        hint="اگر خالی باشد، از عنوان اصلی استفاده می‌شود. حداکثر ۱۶۰ کاراکتر."
                      />
                      <FormTextarea<Values>
                        name="seoDescription"
                        label="توضیحات سئو (meta description)"
                        rows={3}
                        hint="بهترین طول: ۱۵۰ تا ۲۵۵ کاراکتر."
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormInput<Values>
                          name="focusKeyword"
                          label="کلمه‌کلیدی هدف"
                          hint="کلمه اصلی برای بهینه‌سازی."
                        />
                        <FormInput<Values>
                          name="canonicalUrl"
                          label="لینک کنونیکال"
                          dir="ltr"
                          hint="اگر همین مقاله در URL دیگری نسخه اصلی دارد."
                        />
                      </div>
                    </div>

                    <div className="space-y-3 border-t border-border pt-5">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Share2 className="h-4 w-4" />
                        Open Graph و توییتر (override)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        اگر خالی بگذارید، از مقادیر سئو و عنوان اصلی استفاده می‌شود.
                      </p>
                      <FormInput<Values>
                        name="ogTitle"
                        label="عنوان OG"
                      />
                      <FormTextarea<Values>
                        name="ogDescription"
                        label="توضیحات OG"
                        rows={2}
                      />
                      <MediaField<Values>
                        name="ogImage"
                        label="تصویر OG (1200×630)"
                        kind="image"
                        hint="در غیر این صورت تصویر شاخص استفاده می‌شود."
                      />
                      <FormSelect<Values>
                        name="twitterCard"
                        label="نوع کارت توییتر"
                        options={TWITTER_CARD_OPTIONS}
                        placeholder="پیش‌فرض"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* ------------------ RIGHT (sidebar) ------------------ */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>انتشار</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isScheduled && (
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                    این مقاله برای زمان آینده زمان‌بندی شده است. پس از زدن
                    «انتشار»، در زمان مقرر منتشر می‌شود.
                  </div>
                )}
                <Button
                  type="button"
                  className="w-full"
                  onClick={submit(false)}
                >
                  <Save className="h-4 w-4" />
                  ذخیره پیش‌نویس
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={submit(true)}
                >
                  <Send className="h-4 w-4" />
                  {isScheduled ? "ذخیره و زمان‌بندی" : "ذخیره و انتشار"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  زمان‌بندی
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormDateTimePicker<Values>
                  name="scheduledAt"
                  label="انتشار خودکار در"
                  hint="خالی بگذارید برای انتشار فوری پس از تأیید."
                  min={new Date().toISOString()}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  بازبینی پزشکی
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <FormSwitch<Values>
                  name="requireMedicalReview"
                  label="نیاز به بازبینی پزشک"
                  description="مقاله پیش از انتشار، در صف بازبینی قرار می‌گیرد."
                />
                <FormDoctorSelect<Values>
                  name="reviewedByDoctorId"
                  label="پزشک بازبین (اختصاص)"
                  hint="پزشک مشخصی را برای بازبینی این مقاله اختصاص دهید (اختیاری)."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>دسته‌بندی</CardTitle>
              </CardHeader>
              <CardContent>
                <FormSelect<Values>
                  name="categoryId"
                  label="دسته"
                  required
                  options={categoryOptions}
                  placeholder={
                    categoryOptions.length === 0
                      ? "ابتدا یک دسته‌بندی بسازید"
                      : "انتخاب دسته"
                  }
                  hint="برای ایجاد یا ویرایش دسته‌ها به صفحه دسته‌بندی‌ها بروید."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  تصویر شاخص
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <MediaField<Values>
                  name="coverImage"
                  kind="image"
                  hint="از کتابخانه انتخاب کنید یا تصویر جدید بارگذاری کنید."
                />
                <FormInput<Values>
                  name="coverImageAlt"
                  label="متن جایگزین (alt)"
                  hint="توصیف کوتاه تصویر برای دسترسی‌پذیری و سئو."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>برچسب‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                <FormMultiSelect<Values>
                  name="tagIds"
                  label="انتخاب برچسب‌ها"
                  options={tags.map((t) => ({ label: t.name, value: t.id }))}
                />
              </CardContent>
            </Card>

            {/* Lightweight helper note */}
            <div className="rounded-md border border-dashed border-border bg-card p-3 text-[11px] text-muted-foreground flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
              <p>
                در محتوای پزشکی، استفاده از منابع علمی، تعیین رده سنی مخاطب و
                هشدار محتوای حساس از نظر سئو و اعتبار، حیاتی است.
              </p>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
