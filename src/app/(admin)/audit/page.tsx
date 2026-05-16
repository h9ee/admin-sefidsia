import { PageHeader } from "@/components/shared/page-header";
import { AuditList } from "@/features/audit/audit-list";

export const metadata = { title: "لاگ تغییرات — سفید و سیاه" };

export default function AuditPage() {
  return (
    <>
      <PageHeader
        title="لاگ تغییرات"
        description="تاریخچه تمام عملیات‌های ادمین‌ها روی موجودیت‌های سامانه."
      />
      <AuditList />
    </>
  );
}
