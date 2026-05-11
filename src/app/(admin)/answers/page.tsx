import { PageHeader } from "@/components/shared/page-header";
import { AnswersList } from "@/features/answers/answers-list";

export const metadata = { title: "پاسخ‌ها — سفید و سیاه" };

export default function AnswersPage() {
  return (
    <>
      <PageHeader title="پاسخ‌ها" description="مدیریت و نظارت بر پاسخ‌های ارسال‌شده توسط کاربران و پزشکان." />
      <AnswersList />
    </>
  );
}
