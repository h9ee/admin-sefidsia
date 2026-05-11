import { PageHeader } from "@/components/shared/page-header";
import { UserForm } from "@/features/users/user-form";

export const metadata = { title: "کاربر جدید — سفید و سیاه" };

export default function NewUserPage() {
  return (
    <>
      <PageHeader title="ایجاد کاربر" description="یک حساب کاربری جدید بسازید." />
      <UserForm />
    </>
  );
}
