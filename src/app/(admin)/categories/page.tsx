import { PageHeader } from "@/components/shared/page-header";
import { CategoriesTree } from "@/features/categories/categories-tree";

export const metadata = { title: "دسته‌بندی مقالات — سفید و سیاه" };

export default function CategoriesPage() {
  return (
    <>
      <PageHeader
        title="دسته‌بندی مقالات"
        description="ساختار درختی دسته‌ها — تا چهار لایه تو در تو."
      />
      <CategoriesTree />
    </>
  );
}
