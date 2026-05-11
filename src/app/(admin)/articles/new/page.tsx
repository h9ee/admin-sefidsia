import { PageHeader } from "@/components/shared/page-header";
import { ArticleForm } from "@/features/articles/article-form";

export const metadata = { title: "مقاله جدید — سفید و سیاه" };

export default function NewArticlePage() {
  return (
    <>
      <PageHeader title="ایجاد مقاله" description="ایجاد و انتشار یک مقاله جدید." />
      <ArticleForm />
    </>
  );
}
