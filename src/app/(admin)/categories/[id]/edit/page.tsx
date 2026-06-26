import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CategoryForm } from "@/features/categories/category-form";

export const metadata = { title: "ویرایش دسته — سفید و سیاه" };

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId) || numId <= 0) notFound();

  return (
    <>
      <PageHeader
        title="ویرایش دسته"
        description="به‌روزرسانی نام، توضیحات، تصاویر و تنظیمات سئو."
      />
      <CategoryForm id={numId} />
    </>
  );
}
