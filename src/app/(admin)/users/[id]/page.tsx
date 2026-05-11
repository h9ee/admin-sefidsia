import { PageHeader } from "@/components/shared/page-header";
import { UserForm } from "@/features/users/user-form";

export const metadata = { title: "ویرایش کاربر — سفید و سیاه" };

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="ویرایش کاربر" description="بروزرسانی اطلاعات و دسترسی‌های کاربر." />
      <UserForm id={id} />
    </>
  );
}
