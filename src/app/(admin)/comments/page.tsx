import { PageHeader } from "@/components/shared/page-header";
import { CommentsInspector } from "@/features/comments/comments-inspector";

export const metadata = { title: "نظرات — سفید و سیاه" };

export default function CommentsPage() {
  return (
    <>
      <PageHeader
        title="نظرات"
        description="مشاهده و مدیریت نظرات هر مقاله، سوال یا پاسخ."
      />
      <CommentsInspector />
    </>
  );
}
