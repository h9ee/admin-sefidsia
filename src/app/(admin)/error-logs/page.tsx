import { PageHeader } from "@/components/shared/page-header";
import { ErrorLogsList } from "@/features/error-logs/error-logs-list";

export const metadata = { title: "لاگ خطاها — سفید و سیاه" };

export default function ErrorLogsPage() {
  return (
    <>
      <PageHeader
        title="لاگ خطاهای سرور"
        description="مشاهده، بررسی و مدیریت تمام خطاهایی که در سمت سرور رخ می‌دهد."
      />
      <ErrorLogsList />
    </>
  );
}
