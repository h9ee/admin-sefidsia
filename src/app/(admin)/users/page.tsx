import { PageHeader } from "@/components/shared/page-header";
import { UsersList } from "@/features/users/users-list";

export const metadata = { title: "کاربران — سفید و سیاه" };

export default function UsersPage() {
  return (
    <>
      <PageHeader title="کاربران" description="مدیریت کاربران ثبت‌نام شده در پلتفرم." />
      <UsersList />
    </>
  );
}
