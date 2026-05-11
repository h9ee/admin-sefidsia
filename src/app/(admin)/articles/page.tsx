import { PageHeader } from "@/components/shared/page-header";
import { ArticlesList } from "@/features/articles/articles-list";

export const metadata = { title: "مقالات — سفید و سیاه" };

export default function ArticlesPage() {
  return (
    <>
      <PageHeader title="مقالات" description="مدیریت محتوای آموزشی و سلامت پلتفرم." />
      <ArticlesList />
    </>
  );
}
