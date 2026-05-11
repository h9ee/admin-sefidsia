import { PageHeader } from "@/components/shared/page-header";
import { RolesList } from "@/features/roles/roles-list";

export const metadata = { title: "نقش‌ها — سفید و سیاه" };

export default function RolesPage() {
  return (
    <>
      <PageHeader title="نقش‌ها" description="تعریف نقش‌ها و دسترسی‌های قابل اعطا به کاربران." />
      <RolesList />
    </>
  );
}
