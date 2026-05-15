import { PageHeader } from "@/components/shared/page-header";
import { AnswersInspector } from "@/features/answers/answers-inspector";

export const metadata = { title: "پاسخ‌ها — سفید و سیاه" };

export default function AnswersPage() {
  return (
    <>
      <PageHeader
        title="پاسخ‌ها"
        description="بازبینی پاسخ‌های هر سوال و انجام عملیات نظارتی."
      />
      <AnswersInspector />
    </>
  );
}
