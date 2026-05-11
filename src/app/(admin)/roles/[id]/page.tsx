import { PageHeader } from "@/components/shared/page-header";
import { RoleForm } from "@/features/roles/role-form";

export const metadata = { title: "ویرایش نقش — سفید و سیاه" };

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="ویرایش نقش" description="بروزرسانی دسترسی‌ها و مشخصات نقش." />
      <RoleForm id={id} />
    </>
  );
}
