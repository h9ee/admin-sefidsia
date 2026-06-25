import { PageHeader } from "@/components/shared/page-header";
import { ContactList } from "@/features/contact/contact-list";

export const metadata = { title: "پیام‌های تماس — سفید و سیاه" };

export default function ContactMessagesPage() {
  return (
    <>
      <PageHeader
        title="پیام‌های تماس"
        description="پیام‌های ارسالی از فرم «تماس با ما». با تیک‌زدن می‌توانید پیام را به‌عنوان خوانده‌شده ثبت کنید."
      />
      <ContactList />
    </>
  );
}
