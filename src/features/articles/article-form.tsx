"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormInput } from "@/components/forms/form-input";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormMultiSelect } from "@/components/forms/form-multi-select";
import { FormSwitch } from "@/components/forms/form-switch";
import { FormRichEditor } from "@/components/forms/form-rich-editor";
import { articlesService } from "@/services/articles.service";
import { tagsService } from "@/services/tags.service";
import { parseApiError } from "@/lib/api-error";
import type { Tag } from "@/types";

const schema = z.object({
  title: z.string().min(5, "عنوان حداقل ۵ کاراکتر است"),
  summary: z.string().max(500).optional().or(z.literal("")),
  content: z.string().min(50, "محتوا حداقل ۵۰ کاراکتر است"),
  coverImage: z.string().url("لینک معتبر وارد کنید").optional().or(z.literal("")),
  tagIds: z.array(z.string()),
  seoTitle: z.string().max(160).optional().or(z.literal("")),
  seoDescription: z.string().max(255).optional().or(z.literal("")),
  canonicalUrl: z.string().url().optional().or(z.literal("")),
  requireMedicalReview: z.boolean(),
});

type Values = z.infer<typeof schema>;

export function ArticleForm({ slug }: { slug?: string }) {
  const isEdit = !!slug;
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [articleId, setArticleId] = useState<string | null>(null);

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      summary: "",
      content: "",
      coverImage: "",
      tagIds: [],
      seoTitle: "",
      seoDescription: "",
      canonicalUrl: "",
      requireMedicalReview: false,
    },
  });

  useEffect(() => {
    tagsService
      .list({ limit: 100 })
      .then((res) => setTags(res.data))
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
          summary: a.summary ?? "",
          content: a.content,
          coverImage: a.coverImage ?? "",
          tagIds: (a.tags ?? []).map((t) => t.id),
          seoTitle: a.seoTitle ?? "",
          seoDescription: a.seoDescription ?? "",
          canonicalUrl: a.canonicalUrl ?? "",
          requireMedicalReview: a.medicalReviewStatus !== "not_required",
        });
      })
      .catch((e) => toast.error(parseApiError(e).message));
  }, [slug, methods]);

  const submit = (publishAfter?: boolean) =>
    methods.handleSubmit(async (values) => {
      try {
        const clean = (v?: string) => (v && v.length > 0 ? v : undefined);
        const payload = {
          title: values.title,
          summary: clean(values.summary),
          content: values.content,
          coverImage: clean(values.coverImage),
          tagIds: values.tagIds,
          seoTitle: clean(values.seoTitle),
          seoDescription: clean(values.seoDescription),
          canonicalUrl: clean(values.canonicalUrl),
          requireMedicalReview: values.requireMedicalReview,
        };

        const article = isEdit && articleId
          ? await articlesService.update(articleId, payload)
          : await articlesService.create(payload);

        if (publishAfter) {
          await articlesService.publish(article.id);
          toast.success("مقاله برای انتشار ارسال شد");
        } else {
          toast.success(isEdit ? "مقاله بروزرسانی شد" : "مقاله ذخیره شد");
        }
        router.push("/articles");
      } catch (e) {
        toast.error(parseApiError(e).message);
      }
    });

  return (
    <FormProvider {...methods}>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>محتوای مقاله</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <FormInput<Values> name="title" label="عنوان" required />
                <FormTextarea<Values>
                  name="summary"
                  label="چکیده"
                  rows={2}
                  hint="حداکثر ۵۰۰ کاراکتر"
                />
                <FormRichEditor<Values> name="content" label="متن کامل" required />
              </CardContent>
            </Card>

            <Tabs defaultValue="seo">
              <TabsList>
                <TabsTrigger value="seo">سئو</TabsTrigger>
                <TabsTrigger value="meta">سایر</TabsTrigger>
              </TabsList>
              <TabsContent value="seo">
                <Card>
                  <CardContent className="space-y-3 pt-5">
                    <FormInput<Values> name="seoTitle" label="عنوان سئو" />
                    <FormTextarea<Values> name="seoDescription" label="توضیحات سئو" rows={3} />
                    <FormInput<Values> name="canonicalUrl" label="لینک کنونیکال" dir="ltr" />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="meta">
                <Card>
                  <CardContent className="space-y-3 pt-5">
                    <FormSwitch<Values>
                      name="requireMedicalReview"
                      label="نیاز به بازبینی پزشک"
                      description="پس از فعال‌سازی، مقاله پیش از انتشار به بازبینی پزشک ارسال می‌شود."
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>انتشار</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button type="button" className="w-full" onClick={submit(false)}>
                  <Save />
                  ذخیره
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={submit(true)}
                >
                  <Send />
                  ذخیره و انتشار
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تصویر شاخص</CardTitle>
              </CardHeader>
              <CardContent>
                <FormInput<Values>
                  name="coverImage"
                  label="آدرس تصویر"
                  dir="ltr"
                  placeholder="https://…"
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
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
