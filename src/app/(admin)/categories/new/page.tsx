import { PageHeader } from "@/components/shared/page-header";
import { CategoryForm } from "@/features/categories/category-form";

export const metadata = { title: "دسته جدید — سفید و سیاه" };

export default async function NewCategoryPage({
  searchParams,
}: {
  // `?parentId=12` lets the tree pre-select a parent when the editor clicked
  // "افزودن زیردسته" on a specific row.
  searchParams: Promise<{ parentId?: string }>;
}) {
  const sp = await searchParams;
  const raw = Number(sp?.parentId);
  const parentId = Number.isFinite(raw) && raw > 0 ? raw : undefined;

  return (
    <>
      <PageHeader
        title="ایجاد دسته جدید"
        description="دسته‌ای تازه برای سازماندهی مقالات و صفحات سایت."
      />
      <CategoryForm parentId={parentId} />
    </>
  );
}
