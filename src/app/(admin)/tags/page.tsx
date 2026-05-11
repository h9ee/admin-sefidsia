import { PageHeader } from "@/components/shared/page-header";
import { TagsList } from "@/features/tags/tags-list";

export const metadata = { title: "برچسب‌ها — سفید و سیاه" };

export default function TagsPage() {
  return (
    <>
      <PageHeader title="برچسب‌ها" description="مدیریت برچسب‌های مقالات و سوالات." />
      <TagsList />
    </>
  );
}
