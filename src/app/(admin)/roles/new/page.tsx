import { PageHeader } from "@/components/shared/page-header";
import { RoleForm } from "@/features/roles/role-form";

export const metadata = { title: "نقش جدید — سفید و سیاه" };

export default function NewRolePage() {
  return (
    <>
      <PageHeader title="ایجاد نقش" description="یک نقش جدید با مجموعه دسترسی‌های مشخص بسازید." />
      <RoleForm />
    </>
  );
}
