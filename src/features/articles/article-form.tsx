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
import { FormSelect } from "@/components/forms/form-select";
import { FormFileUpload } from "@/components/forms/form-file-upload";
import { FormRichEditor } from "@/components/forms/form-rich-editor";
import { articlesService } from "@/services/articles.service";
import { parseApiError } from "@/lib/api-error";
import { slugify } from "@/lib/format";
import type { Category, Tag } from "@/types";

const schema = z.object({
  title: z.string().min(3, "عنوان حداقل ۳ کاراکتر است"),
  slug: z.string().min(2, "شناسه الزامی است"),
  excerpt: z.string().optional(),
  content: z.string().min(10, "محتوای مقاله الزامی است"),
  status: z.enum(["draft", "review", "published", "archived"]),
  cover: z.any().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function ArticleForm({ id }: { id?: string }) {
  const isEdit = !!id;
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      status: "draft",
      tags: [],
      category: undefined,
      seoTitle: "",
      seoDescription: "",
    },
  });

  useEffect(() => {
    Promise.all([articlesService.listTags(), articlesService.listCategories()])
      .then(([t, c]) => {
        setTags(t);
        setCategories(c);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!id) return;
    articlesService
      .get(id)
      .then((a) =>
        methods.reset({
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt ?? "",
          content: a.content,
          status: a.status,
          cover: a.cover ?? undefined,
          category: a.category?.id,
          tags: a.tags.map((t) => t.id),
          seoTitle: a.seoTitle ?? "",
          seoDescription: a.seoDescription ?? "",
        }),
      )
      .catch((e) => toast.error(parseApiError(e).message));
  }, [id, methods]);

  const title = methods.watch("title");
  useEffect(() => {
    if (!isEdit && title) {
      methods.setValue("slug", slugify(title), { shouldDirty: true });
    }
  }, [title, isEdit, methods]);

  const submit = (publish?: boolean) =>
    methods.handleSubmit(async (values) => {
      try {
        const payload: Record<string, unknown> = {
          title: values.title,
          slug: values.slug,
          excerpt: values.excerpt,
          content: values.content,
          status: publish ? "published" : values.status,
          categoryId: values.category,
          tagIds: values.tags,
          seoTitle: values.seoTitle,
          seoDescription: values.seoDescription,
        };
        const article = isEdit
          ? await articlesService.update(id!, payload)
          : await articlesService.create(payload);

        if (values.cover instanceof File) {
          await articlesService.uploadCover(article.id, values.cover);
        }
        toast.success(publish ? "مقاله منتشر شد" : "مقاله ذخیره شد");
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
                <FormInput<Values>
                  name="slug"
                  label="شناسه (slug)"
                  hint="در آدرس URL استفاده می‌شود"
                  dir="ltr"
                  required
                />
                <FormTextarea<Values>
                  name="excerpt"
                  label="چکیده"
                  rows={2}
                  hint="حداکثر ۲۰۰ کاراکتر"
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
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="meta">
                <Card>
                  <CardContent className="space-y-3 pt-5">
                    <p className="text-xs text-muted-foreground">
                      تنظیمات بیشتر بر اساس نیاز در آینده اضافه خواهد شد.
                    </p>
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
                <FormSelect<Values>
                  name="status"
                  label="وضعیت"
                  options={[
                    { label: "پیش‌نویس", value: "draft" },
                    { label: "نیازمند بازبینی", value: "review" },
                    { label: "منتشر شده", value: "published" },
                    { label: "بایگانی", value: "archived" },
                  ]}
                />
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
                  انتشار سریع
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تصویر شاخص</CardTitle>
              </CardHeader>
              <CardContent>
                <FormFileUpload<Values> name="cover" label="کاور" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>دسته‌بندی و برچسب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <FormSelect<Values>
                  name="category"
                  label="دسته‌بندی"
                  options={categories.map((c) => ({ label: c.name, value: c.id }))}
                />
                <FormMultiSelect<Values>
                  name="tags"
                  label="برچسب‌ها"
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
