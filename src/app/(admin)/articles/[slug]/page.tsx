import { PageHeader } from "@/components/shared/page-header";
import { ArticleForm } from "@/features/articles/article-form";

export const metadata = { title: "ویرایش مقاله — سفید و سیاه" };

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <>
      <PageHeader
        title="ویرایش مقاله"
        description="بروزرسانی محتوا، انتشار و تنظیمات سئو."
      />
      <ArticleForm slug={slug} />
    </>
  );
}
