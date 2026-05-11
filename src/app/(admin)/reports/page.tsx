import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportsList } from "@/features/reports/reports-list";
import { ModerationLogs } from "@/features/reports/moderation-logs";

export const metadata = { title: "گزارش‌ها — سفید و سیاه" };

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="گزارش‌ها و نظارت"
        description="بررسی گزارش‌های کاربران و مدیریت محتوای دارای علامت."
      />
      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">گزارش‌ها</TabsTrigger>
          <TabsTrigger value="logs">لاگ نظارت</TabsTrigger>
        </TabsList>
        <TabsContent value="reports">
          <ReportsList />
        </TabsContent>
        <TabsContent value="logs">
          <ModerationLogs />
        </TabsContent>
      </Tabs>
    </>
  );
}
