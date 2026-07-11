"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe2,
  ImagePlus,
  Loader2,
  RotateCcw,
  Save,
  Search,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import { parseApiError } from "@/lib/api-error";
import { mediaUrl } from "@/lib/media-url";
import { mediaService } from "@/services/media.service";
import { pageSeoService } from "@/services/page-seo.service";
import type { PageSeoKey, PageSeoSetting } from "@/types/page-seo";

type PageDefinition = {
  key: PageSeoKey;
  label: string;
  path: string;
  title: string;
  description: string;
  index: boolean;
};

const PAGES: PageDefinition[] = [
  { key: "home", label: "صفحه اصلی", path: "/", title: "سفید سیاه | مرجع محتوای سلامت، بیماری‌ها و سبک زندگی", description: "سفید سیاه رسانه سلامت فارسی برای پاسخ به سوالات روزمره درباره بیماری‌ها، تغذیه، سلامت روان و سبک زندگی سالم است.", index: true },
  { key: "articles", label: "مقالات", path: "/articles", title: "مقالات سلامت", description: "جدیدترین مقالات تخصصی سلامت، پزشکی، تغذیه، روانشناسی و سبک زندگی، نوشته و بازبینی شده توسط متخصصان.", index: true },
  { key: "categories", label: "دسته‌بندی‌ها", path: "/categories", title: "دسته‌بندی‌های سلامت", description: "دسته‌بندی‌های تخصصی محتوای سلامت در سفید و سیاه: روانشناسی، تغذیه، قلب، کودکان و بسیاری دیگر.", index: true },
  { key: "questions", label: "پرسش و پاسخ", path: "/questions", title: "پرسش و پاسخ پزشکی", description: "هزاران پرسش و پاسخ تخصصی پزشکی، با پاسخ مستقیم از پزشکان متخصص.", index: true },
  { key: "doctors", label: "پزشکان", path: "/doctors", title: "پزشکان متخصص", description: "لیست پزشکان متخصص با تخصص‌های مختلف، بیوگرافی، مقالات، پاسخ‌ها و امتیاز پزشکان.", index: true },
  { key: "tags", label: "برچسب‌ها", path: "/tags", title: "همه برچسب‌ها", description: "فهرست کامل برچسب‌های موضوعی سفید سیاه برای کاوش محتوای تخصصی سلامت، بیماری‌ها و سبک زندگی.", index: true },
  { key: "about", label: "درباره ما", path: "/about", title: "درباره سفید سیاه | رسانه سلامت فارسی", description: "با سفید سیاه بیشتر آشنا شوید؛ رسانه‌ای سلامت محور برای ارائه اطلاعات علمی، قابل فهم و کاربردی.", index: true },
  { key: "contact-us", label: "تماس با ما", path: "/contact-us", title: "تماس با سفید سیاه | ارتباط با تیم تحریریه", description: "برای ارسال پیشنهاد، گزارش خطا، همکاری محتوایی یا ارتباط با تیم سفید سیاه با ما در تماس باشید.", index: true },
  { key: "terms", label: "قوانین و مقررات", path: "/terms", title: "قوانین و مقررات", description: "قوانین و مقررات استفاده از پلتفرم سفید و سیاه", index: true },
  { key: "privacy", label: "حریم خصوصی", path: "/privacy", title: "حریم خصوصی", description: "سیاست حریم خصوصی پلتفرم سفید و سیاه", index: true },
  { key: "doctor-apply", label: "درخواست پزشک", path: "/doctors/apply", title: "درخواست همکاری به‌عنوان پزشک", description: "فرم درخواست همکاری برای پزشکان متخصص و انتشار پروفایل پس از تأیید مدیر.", index: false },
];

type Draft = {
  title: string;
  description: string;
  focusKeyword: string;
  keywords: string;
  canonicalUrl: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogImageAlt: string;
  twitterCard: "summary" | "summary_large_image";
};

function makeDraft(page: PageDefinition, saved?: PageSeoSetting): Draft {
  return {
    title: saved?.title || page.title,
    description: saved?.description || page.description,
    focusKeyword: saved?.focusKeyword || "",
    keywords: saved?.keywords?.join("، ") || "",
    canonicalUrl: saved?.canonicalUrl || page.path,
    robotsIndex: saved?.robotsIndex ?? page.index,
    robotsFollow: saved?.robotsFollow ?? true,
    ogTitle: saved?.ogTitle || "",
    ogDescription: saved?.ogDescription || "",
    ogImage: saved?.ogImage || "",
    ogImageAlt: saved?.ogImageAlt || "",
    twitterCard: saved?.twitterCard || "summary_large_image",
  };
}

const nullable = (value: string) => value.trim() || null;

export function PageSeoSettings() {
  const [selectedKey, setSelectedKey] = useState<PageSeoKey>("home");
  const [savedByKey, setSavedByKey] = useState<Partial<Record<PageSeoKey, PageSeoSetting>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const page = PAGES.find((item) => item.key === selectedKey) ?? PAGES[0];
  const saved = savedByKey[selectedKey];
  const [draft, setDraft] = useState<Draft>(() => makeDraft(page));

  useEffect(() => {
    pageSeoService.list()
      .then((items) => {
        const indexed = Object.fromEntries(items.map((item) => [item.pageKey, item])) as Partial<Record<PageSeoKey, PageSeoSetting>>;
        setSavedByKey(indexed);
        setDraft(makeDraft(PAGES[0], indexed.home));
      })
      .catch((error) => toast.error(parseApiError(error).message))
      .finally(() => setLoading(false));
  }, []);

  const previewTitle = draft.ogTitle || draft.title;
  const previewDescription = draft.ogDescription || draft.description;
  const keywordList = useMemo(
    () => draft.keywords.split(/[،,]/).map((item) => item.trim()).filter(Boolean),
    [draft.keywords],
  );

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const selectPage = (item: PageDefinition) => {
    setSelectedKey(item.key);
    setDraft(makeDraft(item, savedByKey[item.key]));
  };

  const save = async () => {
    setSaving(true);
    try {
      const item = await pageSeoService.update(selectedKey, {
        title: nullable(draft.title),
        description: nullable(draft.description),
        focusKeyword: nullable(draft.focusKeyword),
        keywords: keywordList.length ? keywordList : null,
        canonicalUrl: nullable(draft.canonicalUrl),
        robotsIndex: draft.robotsIndex,
        robotsFollow: draft.robotsFollow,
        ogTitle: nullable(draft.ogTitle),
        ogDescription: nullable(draft.ogDescription),
        ogImage: nullable(draft.ogImage),
        ogImageAlt: nullable(draft.ogImageAlt),
        twitterCard: draft.twitterCard,
      });
      setSavedByKey((current) => ({ ...current, [selectedKey]: item }));
      toast.success("تنظیمات سئو ذخیره شد");
    } catch (error) {
      toast.error(parseApiError(error).message);
    } finally {
      setSaving(false);
    }
  };

  const restore = async () => {
    if (!saved || !window.confirm("تنظیمات سفارشی این صفحه حذف و مقادیر پیش‌فرض فعال شود؟")) return;
    setSaving(true);
    try {
      await pageSeoService.remove(selectedKey);
      setSavedByKey((current) => {
        const next = { ...current };
        delete next[selectedKey];
        return next;
      });
      setDraft(makeDraft(page));
      toast.success("مقادیر پیش‌فرض فعال شد");
    } catch (error) {
      toast.error(parseApiError(error).message);
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const item = await mediaService.upload({ file, alt: draft.ogImageAlt, folder: "seo" });
      update("ogImage", item.url);
      toast.success("تصویر بارگذاری شد");
    } catch (error) {
      toast.error(parseApiError(error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (loading) {
    return <div className="flex min-h-64 items-center justify-center text-muted-foreground"><Loader2 className="ml-2 size-5 animate-spin" />در حال دریافت تنظیمات...</div>;
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="overflow-hidden rounded-lg border border-border bg-card lg:sticky lg:top-20">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">صفحات عمومی</p>
          <p className="mt-0.5 text-xs text-muted-foreground">یک صفحه را برای ویرایش انتخاب کنید</p>
        </div>
        <nav className="max-h-[65vh] space-y-1 overflow-y-auto p-2">
          {PAGES.map((item) => {
            const customized = Boolean(savedByKey[item.key]);
            return (
              <button key={item.key} type="button" onClick={() => selectPage(item)}
                className={cn("flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-right text-sm transition-colors", selectedKey === item.key ? "bg-primary text-primary-foreground" : "hover:bg-accent")}
              >
                <FileText className="size-4 shrink-0" />
                <span className="min-w-0 flex-1"><span className="block truncate font-medium">{item.label}</span><span dir="ltr" className={cn("block truncate text-[11px]", selectedKey === item.key ? "text-primary-foreground/70" : "text-muted-foreground")}>{item.path}</span></span>
                {customized ? <CheckCircle2 className="size-4 shrink-0 text-success" /> : null}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2"><h2 className="text-lg font-semibold">{page.label}</h2><Badge variant={saved ? "success" : "muted"}>{saved ? "سفارشی" : "پیش‌فرض"}</Badge></div>
            <a href={`https://sefidsiah.com${page.path}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ExternalLink className="size-3.5" />مشاهده صفحه</a>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={restore} disabled={!saved || saving}><RotateCcw />بازگشت به پیش‌فرض</Button>
            <Button type="button" onClick={save} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Save />}ذخیره تغییرات</Button>
          </div>
        </div>

        <section className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2"><Search className="size-4 text-primary" /><h3 className="font-semibold">نتایج جست‌وجو</h3></div>
          <Field label="عنوان سئو" count={`${draft.title.length}/60`} tone={draft.title.length > 60 ? "warn" : "normal"}><Input value={draft.title} onChange={(e) => update("title", e.target.value)} maxLength={160} /></Field>
          <Field label="توضیحات متا" count={`${draft.description.length}/160`} tone={draft.description.length > 160 ? "warn" : "normal"}><Textarea value={draft.description} onChange={(e) => update("description", e.target.value)} maxLength={320} rows={3} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="عبارت کلیدی اصلی"><Input value={draft.focusKeyword} onChange={(e) => update("focusKeyword", e.target.value)} placeholder="مثلاً سلامت و پزشکی" /></Field>
            <Field label="کلمات کلیدی" hint="با ویرگول جدا کنید"><Input value={draft.keywords} onChange={(e) => update("keywords", e.target.value)} placeholder="سلامت، پزشکی، تغذیه" /></Field>
          </div>
          <Field label="آدرس Canonical"><Input dir="ltr" value={draft.canonicalUrl} onChange={(e) => update("canonicalUrl", e.target.value)} placeholder={page.path} /></Field>
          <div dir="ltr" className="rounded-lg border border-border bg-background p-4 text-left font-sans">
            <p className="truncate text-xs text-success">sefidsiah.com{page.path}</p>
            <p className="mt-1 truncate text-lg text-blue-700 dark:text-blue-400">{draft.title || page.title}</p>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{draft.description || page.description}</p>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2"><Share2 className="size-4 text-primary" /><h3 className="font-semibold">اشتراک‌گذاری اجتماعی</h3></div>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="عنوان Open Graph"><Input value={draft.ogTitle} onChange={(e) => update("ogTitle", e.target.value)} placeholder="در صورت خالی بودن، عنوان سئو استفاده می‌شود" maxLength={160} /></Field><Field label="نوع کارت X / Twitter"><Select value={draft.twitterCard} onValueChange={(value: Draft["twitterCard"]) => update("twitterCard", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="summary_large_image">تصویر بزرگ</SelectItem><SelectItem value="summary">خلاصه کوچک</SelectItem></SelectContent></Select></Field></div>
          <Field label="توضیحات Open Graph"><Textarea value={draft.ogDescription} onChange={(e) => update("ogDescription", e.target.value)} placeholder="در صورت خالی بودن، توضیحات متا استفاده می‌شود" maxLength={320} rows={3} /></Field>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <Field label="تصویر اجتماعی" hint="پیشنهاد: 1200 × 630 پیکسل"><Input dir="ltr" value={draft.ogImage} onChange={(e) => update("ogImage", e.target.value)} placeholder="https://... یا /uploads/..." /></Field>
            <div className="self-end"><input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => uploadImage(e.target.files?.[0])} /><Button type="button" variant="outline" className="w-full" disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}بارگذاری تصویر</Button></div>
          </div>
          <Field label="متن جایگزین تصویر"><Input value={draft.ogImageAlt} onChange={(e) => update("ogImageAlt", e.target.value)} maxLength={160} /></Field>
          <div className="overflow-hidden rounded-lg border border-border bg-background sm:max-w-xl">
            {draft.ogImage ? <Image unoptimized src={mediaUrl(draft.ogImage)} alt={draft.ogImageAlt || "پیش‌نمایش"} width={1200} height={630} className="aspect-[1.91/1] w-full object-cover" /> : <div className="flex aspect-[1.91/1] items-center justify-center bg-muted text-sm text-muted-foreground"><ImagePlus className="ml-2 size-5" />تصویری انتخاب نشده است</div>}
            <div className="p-3"><p className="truncate text-xs text-muted-foreground">SEFIDSIAH.COM</p><p className="mt-1 truncate font-semibold">{previewTitle}</p><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{previewDescription}</p></div>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2"><Globe2 className="size-4 text-primary" /><h3 className="font-semibold">دسترسی ربات‌ها</h3></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <RobotControl label="نمایش در نتایج جست‌وجو" description="اجازه index شدن این صفحه" checked={draft.robotsIndex} onChange={(value) => update("robotsIndex", value)} />
            <RobotControl label="دنبال کردن لینک‌ها" description="اجازه follow کردن لینک‌های صفحه" checked={draft.robotsFollow} onChange={(value) => update("robotsFollow", value)} />
          </div>
          {!draft.robotsIndex ? <p className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">این صفحه با دستور noindex از نتایج موتورهای جست‌وجو حذف می‌شود.</p> : null}
        </section>
      </div>
    </div>
  );
}

function Field({ label, hint, count, tone = "normal", children }: { label: string; hint?: string; count?: string; tone?: "normal" | "warn"; children: React.ReactNode }) {
  return <div className="space-y-1.5"><div className="flex items-center justify-between gap-3"><Label>{label}</Label>{count ? <span className={cn("text-xs", tone === "warn" ? "text-warning" : "text-muted-foreground")}>{count}</span> : null}</div>{children}{hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}</div>;
}

function RobotControl({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-4"><div><Label>{label}</Label><p className="mt-0.5 text-xs text-muted-foreground">{description}</p></div><Switch checked={checked} onCheckedChange={onChange} /></div>;
}
