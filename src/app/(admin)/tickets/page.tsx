import { PageHeader } from "@/components/shared/page-header";
import { TicketsList } from "@/features/tickets/tickets-list";
import { TicketsStats } from "@/features/tickets/tickets-stats";

export const metadata = { title: "تیکت‌ها — سفید و سیاه" };

export default function TicketsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="تیکت‌های پشتیبانی"
        description="مدیریت گفتگوهای پشتیبانی، واگذاری به اعضای تیم و پاسخ‌دهی به کاربران."
      />
      <TicketsStats />
      <TicketsList />
    </div>
  );
}
