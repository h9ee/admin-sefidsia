import { PageHeader } from "@/components/shared/page-header";
import { CommentsList } from "@/features/comments/comments-list";

export const metadata = { title: "نظرات — سفید و سیاه" };

export default function CommentsPage() {
  return (
    <>
      <PageHeader title="نظرات" description="مدیریت و بازبینی نظرات کاربران." />
      <CommentsList />
    </>
  );
}
