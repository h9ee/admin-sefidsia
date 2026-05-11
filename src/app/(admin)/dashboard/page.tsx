import { PageHeader } from "@/components/shared/page-header";
import { Dashboard } from "@/features/dashboard/dashboard";

export const metadata = { title: "داشبورد — سفید و سیاه" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="داشبورد"
        description="یک نگاه کلی به وضعیت پلتفرم سفید و سیاه."
      />
      <Dashboard />
    </>
  );
}
