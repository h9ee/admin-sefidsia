import { PageHeader } from "@/components/shared/page-header";
import { QuestionsList } from "@/features/questions/questions-list";

export const metadata = { title: "سوالات — سفید و سیاه" };

export default function QuestionsPage() {
  return (
    <>
      <PageHeader
        title="سوالات"
        description="نظارت و مدیریت سوالات کاربران، تشخیص محتوای خطرناک و پرطرفدار."
      />
      <QuestionsList />
    </>
  );
}
