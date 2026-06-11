import { PageHeader } from "@/components/shared/page-header";
import { TagForm } from "@/features/tags/tag-form";

export const metadata = { title: "برچسب جدید — سفید و سیاه" };

export default function NewTagPage() {
  return (
    <>
      <PageHeader
        title="برچسب جدید"
        description="برچسب جدید برای دسته‌بندی مقالات و سوالات بسازید."
      />
      <TagForm editing={null} />
    </>
  );
}
