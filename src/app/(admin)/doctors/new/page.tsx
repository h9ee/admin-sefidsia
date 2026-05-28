import { PageHeader } from "@/components/shared/page-header";
import { DoctorCreateForm } from "@/features/doctors/doctor-create-form";

export const metadata = { title: "پزشک جدید — سفید و سیاه" };

export default function NewDoctorPage() {
  return (
    <>
      <PageHeader
        title="ایجاد پزشک جدید"
        description="یک کاربر موجود را به‌عنوان پزشک ثبت کنید. وضعیت تأیید پس از ساخت، در حالت «در انتظار» قرار می‌گیرد."
      />
      <DoctorCreateForm />
    </>
  );
}
