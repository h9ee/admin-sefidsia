import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "@/features/settings/profile-form";
import { Preferences } from "@/features/settings/preferences";
import { NotificationPrefs } from "@/features/settings/notification-prefs";
import { PageSeoSettings } from "@/features/settings/page-seo-settings";

export const metadata = { title: "تنظیمات — سفید و سیاه" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="تنظیمات" description="مدیریت پروفایل، ترجیحات و سئوی صفحات سایت." />
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">پروفایل</TabsTrigger>
          <TabsTrigger value="appearance">نمایش</TabsTrigger>
          <TabsTrigger value="notifications">اعلان‌ها</TabsTrigger>
          <TabsTrigger value="seo">سئوی صفحات</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <ProfileForm />
        </TabsContent>
        <TabsContent value="appearance">
          <Preferences />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationPrefs />
        </TabsContent>
        <TabsContent value="seo">
          <PageSeoSettings />
        </TabsContent>
      </Tabs>
    </>
  );
}
