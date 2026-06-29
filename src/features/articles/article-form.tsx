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
  Loader2,
  Plus,
  Save,
  Send,
  Share2,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  FormRelatedArticles,
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
  ArticleStatus,
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

/** Strip `https://doi.org/` / `doi:` wrappers so we store the bare DOI. */
const normaliseDoi = (v: string): string =>
  v.trim().replace(/^(https?:\/\/(dx\.)?doi\.org\/|doi:\s*)/i, "").trim();
/** Strip `PMID:` prefix so we store only digits. */
const normalisePmid = (v: string): string =>
  v.trim().replace(/^pmid:\s*/i, "").trim();

const referenceItemSchema = z.object({
  title: z.string().min(2, "عنوان منبع الزامی است"),
  // URL is required now — every reference must be verifiable. Mirrors the
  // backend schema; without this the admin form lets an invalid record
  // through and the backend rejects it on save.
  url: z.string().url("URL منبع الزامی و باید معتبر باشد"),
  doi: z
    .string()
    .transform(normaliseDoi)
    .refine(
      (v) => v === "" || /^10\.\d{4,9}\/\S+$/.test(v),
      "DOI باید فقط شناسه باشد (مثل 10.1056/NEJMoa1801993)",
    )
    .optional()
    .or(z.literal("")),
  pmid: z
    .string()
    .transform(normalisePmid)
    .refine((v) => v === "" || /^\d+$/.test(v), "PMID باید فقط عدد باشد")
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
  content2: z.string().optional().or(z.literal("")),
  content3: z.string().optional().or(z.literal("")),
  url: z
    .string()
    .max(500)
    .optional()
    .or(z.literal("")),
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
  commonMistakes: z.array(z.string()),
  // Editor-curated related-article ids, in render order. Stored as plain
  // numbers (the picker widget normalises strings → numbers before writing
  // into form state, so no z.coerce here — that would turn the inferred
  // input type into `unknown[]` and break the resolver match).
  relatedArticleIds: z.array(z.number().int().positive()).max(12),
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

  // Publication status (admin/developer can override the workflow defaults).
  status: z.enum([
    "draft",
    "pending_review",
    "scheduled",
    "published",
    "rejected",
    "archived",
  ]),
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

const STATUS_OPTIONS: { label: string; value: ArticleStatus }[] = [
  { label: "پیش‌نویس", value: "draft" },
  { label: "در انتظار بازبینی", value: "pending_review" },
  { label: "زمان‌بندی‌شده", value: "scheduled" },
  { label: "منتشر شده", value: "published" },
  { label: "رد شده", value: "rejected" },
  { label: "بایگانی‌شده", value: "archived" },
];

/* ---------------------------- Helpers ---------------------------- */

/** Walks a (possibly nested) react-hook-form errors object and returns the
 *  first human-readable `message`, so silent validation failures surface as a
 *  toast instead of the save button appearing to do nothing. */
function firstErrorMessage(errors: unknown): string | undefined {
  if (!errors || typeof errors !== "object") return undefined;
  const obj = errors as Record<string, unknown>;
  if (typeof obj.message === "string" && obj.message) return obj.message;
  for (const key of Object.keys(obj)) {
    const found = firstErrorMessage(obj[key]);
    if (found) return found;
  }
  return undefined;
}

/* ---------------------------- Component ---------------------------- */

export function ArticleForm({ slug }: { slug?: string }) {
  const isEdit = !!slug;
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  // Track tags-fetch completion separately from `tags.length` — on a fresh DB
  // the list legitimately is empty, and we must NOT keep the form's `reset`
  // gated forever in that case.
  const [tagsLoaded, setTagsLoaded] = useState(false);
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [articleId, setArticleId] = useState<string | null>(null);
  // Track which action button is in flight so we can spin only the one
  // that was clicked and disable the rest meanwhile.
  const [busyAction, setBusyAction] = useState<null | "draft" | "publish">(null);

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      subtitle: "",
      summary: "",
      content: "",
      content2: "",
      content3: "",
      url: "",
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
      commonMistakes: [],
      relatedArticleIds: [],
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
      status: "draft",
    },
  });

  useEffect(() => {
    tagsService
      .list({ limit: 100 })
      .then((res) => setTags(res.data))
      .catch(() => undefined)
      .finally(() => setTagsLoaded(true));
    categoriesService
      .listTree()
      .then((t) => setTree(t))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!slug) return;
    // We MUST wait for BOTH the category tree AND the tags list before
    // resetting the form. Radix's Select / Combobox bind value→label at
    // mount and won't re-resolve once items arrive, so resetting with
    // `tagIds: ["14","15","16"]` while `tags=[]` left the multi-select
    // visually empty even though the value was stored — which is exactly
    // why the article's saved tags didn't appear on edit.
    if (tree.length === 0 || !tagsLoaded) return;
    articlesService
      .getBySlug(slug)
      .then((a) => {
        setArticleId(a.id);
        // Robust fallbacks: read the FK column if present, otherwise fall back
        // to the included relation (`category.id`, `reviewer.id`). Tag ids are
        // coerced to strings to match the multi-select option values.
        const aAny = a as typeof a & {
          category?: { id?: number | string } | null;
          reviewer?: { id?: number | string } | null;
        };
        const categoryFK =
          aAny.categoryId != null
            ? String(aAny.categoryId)
            : aAny.category?.id != null
              ? String(aAny.category.id)
              : "";
        const reviewerFK =
          aAny.reviewedByDoctorId != null
            ? Number(aAny.reviewedByDoctorId)
            : aAny.reviewer?.id != null
              ? Number(aAny.reviewer.id)
              : null;

        methods.reset({
          title: a.title,
          subtitle: a.subtitle ?? "",
          summary: a.summary ?? "",
          content: a.content,
          content2: a.content2 ?? "",
          content3: a.content3 ?? "",
          url: a.url ?? "",
          coverImage: a.coverImage ?? "",
          coverImageAlt: a.coverImageAlt ?? "",
          categoryId: categoryFK,
          tagIds: (a.tags ?? []).map((t) => String(t.id)),

          contentType: a.contentType ?? "guide",
          audienceLevel: a.audienceLevel ?? "general",
          audienceAge: a.audienceAge ?? "all",
          contentWarning: a.contentWarning ?? "none",
          disclaimer: a.disclaimer ?? "",

          allowComments: a.allowComments ?? true,
          allowReactions: a.allowReactions ?? true,
          isFeatured: a.isFeatured ?? false,

          keyTakeaways: a.keyTakeaways ?? [],
          commonMistakes: a.commonMistakes ?? [],
          relatedArticleIds: a.relatedArticleIds ?? [],
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

          reviewedByDoctorId: reviewerFK,
          requireMedicalReview: a.medicalReviewStatus !== "not_required",

          scheduledAt: a.scheduledAt ?? null,
          status: a.status ?? "draft",
        });
      })
      .catch((e) => toast.error(parseApiError(e).message));
    // `tree.length` + `tagsLoaded` are in the deps so the effect re-runs once
    // either dependent list finishes loading. The early-return above makes the
    // first run (before tree/tags arrive) harmless; the actual reset happens
    // on a later pass once both are ready.
  }, [slug, methods, tree.length, tagsLoaded]);

  // Canonical form for `url` is space-separated — the dash is reserved for the
  // public-link rendering (`articleHref()` converts spaces → dashes). If the
  // editor types/pastes a `-`, silently rewrite it back to a space so the
  // value heading to the backend is always the canonical form. This kills
  // the old "both forms accepted on disk" leakage at the source.
  const watchedUrl = methods.watch("url");
  useEffect(() => {
    if (typeof watchedUrl !== "string" || !watchedUrl.includes("-")) return;
    const cleaned = watchedUrl.replace(/-+/g, " ").replace(/\s+/g, " ");
    if (cleaned !== watchedUrl) {
      methods.setValue("url", cleaned, { shouldValidate: false, shouldDirty: true });
    }
  }, [watchedUrl, methods]);

  const categoryOptions = useMemo(
    () =>
      flattenTree(tree).map((n) => ({
        label: indentedLabel(n),
        value: String(n.id),
      })),
    [tree],
  );

  const submit = (publishAfter?: boolean) =>
    methods.handleSubmit(
    async (values) => {
      if (busyAction) return; // guard against double-click while a save is mid-flight
      setBusyAction(publishAfter ? "publish" : "draft");
      try {
        const clean = (v?: string | null) =>
          v && v.length > 0 ? v : undefined;
        // List fields (keyTakeaways/faq/references) MUST be sent as
        // arrays — never coerced to `undefined`. The backend skips fields
        // that arrive as `undefined` (so it can support partial PATCHes),
        // which means "clear all FAQs" used to vanish from the payload
        // entirely and never persist. Sending `[]` makes the backend's
        // `cleanList` resolve to `null` and the column is cleared.

        const payload = {
          title: values.title,
          subtitle: clean(values.subtitle),
          summary: clean(values.summary),
          content: values.content,
          // content2/content3 are optional secondary blocks. Send them as raw
          // strings (never `undefined`) so emptying one on EDIT actually clears
          // the column. Routing them through `clean()` turned an empty value
          // into `undefined`; JSON.stringify then dropped the key, and the
          // backend — which skips `undefined` fields to support partial PATCHes
          // — kept the OLD text. Same trap the list fields (keyTakeaways/faq/
          // references) avoid by always sending a value. The backend's
          // `cleanString("")` maps the empty string back to NULL, so the create
          // path is unchanged (empty → NULL just as before).
          content2: values.content2 ?? "",
          content3: values.content3 ?? "",
          // Belt-and-braces: strip dashes here too in case any older code path
          // injects a `-` (e.g. paste from clipboard before the watcher fires).
          // The backend stores the canonical space-separated form; dashes only
          // exist as the public-link rendering convention.
          url: clean(
            values.url
              ?.replace(/-+/g, " ")
              .replace(/\s+/g, " ")
              .trim(),
          ),
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

          keyTakeaways: values.keyTakeaways
            .map((s) => s.trim())
            .filter(Boolean),
          commonMistakes: values.commonMistakes
            .map((s) => s.trim())
            .filter(Boolean),
          relatedArticleIds: values.relatedArticleIds.filter(
            (n) => Number.isInteger(n) && n > 0,
          ),
          faq: values.faq.filter(
            (f) => f.question.trim() && f.answer.trim(),
          ),
          references: values.references.filter((r) => r.title.trim()),

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
          status: values.status,
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
      } finally {
        setBusyAction(null);
      }
    },
    (errors) => {
      const msg = firstErrorMessage(errors);
      toast.error(msg ?? "لطفاً خطاهای فرم را برطرف کنید و دوباره تلاش کنید.");
    },
    );

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
                <FormInput<Values>
                  name="url"
                  label="نشانی (URL) مقاله"
                  dir="auto"
                  placeholder="مثال: آلرژی نوزادان به پروتئین چیست"
                  hint="متن دلخواه با فاصله وارد کنید (بدون خط تیره). در سایت، فاصله‌ها برای ساخت لینک خودکار به «-» تبدیل می‌شوند."
                />
                <FormRichEditor<Values>
                  name="content"
                  label="متن کامل"
                  required
                />
                <FormRichEditor<Values>
                  name="content2"
                  label="محتوای دوم"
                />
                <FormRichEditor<Values>
                  name="content3"
                  label="محتوای سوم"
                />
              </CardContent>
            </Card>

            <Tabs defaultValue="highlights" dir="rtl">
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
              <TabsContent value="highlights" dir="rtl"> 
                <Card>
                  <CardContent className="space-y-5 pt-5">
                    <FormStringList<Values>
                      name="keyTakeaways"
                      label="نکات کلیدی"
                      hint="3 تا 5 نکته اصلی که خواننده باید بداند — در بالای مقاله نمایش داده می‌شوند."
                      max={10}
                      placeholder="یک نکته کلیدی…"
                    />
                    <FormStringList<Values>
                      name="commonMistakes"
                      label="اشتباهات رایج"
                      hint="باورهای غلط یا خطاهای پرتکرار درباره موضوع — به‌صورت کالاوت قرمز در فرانت نمایش داده می‌شوند."
                      max={10}
                      placeholder="مثلاً: «هر دردِ قفسهٔ سینه قلبی است»"
                    />
                    <FormFaqEditor<Values>
                      name="faq"
                      label="پرسش‌های متداول (FAQ)"
                      hint="هر پرسش/پاسخ به‌صورت Rich Snippet در گوگل نمایش داده می‌شود."
                    />
                    <FormRelatedArticles<Values>
                      name="relatedArticleIds"
                      label="مقالات مرتبط (دستی)"
                      hint="در صورت خالی بودن، فهرست خودکار براساس دسته‌بندی نمایش داده می‌شود. حداکثر ۱۲ مقاله — به همان ترتیبی که اینجا چیده می‌شود."
                      max={12}
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
                      hint="عنوان و URL منبع الزامی است. DOI و PMID فقط شناسهٔ خالص (بدون https:// یا doi: یا PMID:) ذخیره می‌شود؛ اگر آدرس کامل بچسبانی، خودکار پاک‌سازی می‌شود."
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
                  disabled={busyAction !== null}
                >
                  {busyAction === "draft" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {busyAction === "draft" ? "در حال ذخیره…" : "ذخیره پیش‌نویس"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={submit(true)}
                  disabled={busyAction !== null}
                >
                  {busyAction === "publish" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {busyAction === "publish"
                    ? isScheduled
                      ? "در حال زمان‌بندی…"
                      : "در حال انتشار…"
                    : isScheduled
                      ? "ذخیره و زمان‌بندی"
                      : "ذخیره و انتشار"}
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
                <CardTitle>وضعیت انتشار</CardTitle>
              </CardHeader>
              <CardContent>
                <FormSelect<Values>
                  name="status"
                  label="وضعیت"
                  options={STATUS_OPTIONS}
                  hint="وضعیت مقاله را انتخاب کنید (فقط برای ادمین/توسعه‌دهنده اعمال می‌شود)."
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
              <CardContent className="space-y-3">
                <FormMultiSelect<Values>
                  name="tagIds"
                  label="انتخاب برچسب‌ها"
                  options={tags.map((t) => ({ label: t.name, value: String(t.id) }))}
                />
                <InlineCreateTag
                  onCreated={(t) => {
                    setTags((prev) => {
                      if (prev.some((p) => p.id === t.id)) return prev;
                      return [...prev, t];
                    });
                    const current = methods.getValues("tagIds") ?? [];
                    if (!current.includes(String(t.id))) {
                      methods.setValue(
                        "tagIds",
                        [...current, String(t.id)],
                        { shouldDirty: true, shouldValidate: true },
                      );
                    }
                  }}
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

/**
 * Inline "create a new tag" row. Lives under the tags multi-select so editors
 * don't have to leave the article form to add a missing tag.
 *
 * Posts to `tagsService.create` which the backend treats as a pending tag
 * (admins/moderators may need to approve it later). The new tag is bubbled
 * back to the caller via `onCreated` so the parent can refresh its local
 * `tags` cache and auto-select the new id.
 */
function InlineCreateTag({ onCreated }: { onCreated: (tag: Tag) => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("نام برچسب باید حداقل ۲ کاراکتر باشد.");
      return;
    }
    setBusy(true);
    try {
      const created = await tagsService.create({ name: trimmed });
      onCreated(created);
      setName("");
      toast.success(`برچسب «${created.name}» ساخته شد و انتخاب گردید.`);
    } catch (err) {
      toast.error(parseApiError(err)?.message ?? "ساخت برچسب ناموفق بود.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-md border border-dashed border-border bg-card p-3">
      <p className="mb-2 text-[11px] text-muted-foreground">
        برچسب مدنظر در لیست بالا نیست؟ همین‌جا بسازید — به‌محض ایجاد، خودکار
        انتخاب می‌شود.
      </p>
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            // Enter inside the inline input should NOT submit the outer
            // article form — it should only create the tag.
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              void submit();
            }
          }}
          placeholder="نام برچسب جدید…"
          maxLength={60}
          disabled={busy}
          className="h-9 text-sm"
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={submit}
          disabled={busy || name.trim().length < 2}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          ایجاد
        </Button>
      </div>
    </div>
  );
}
