import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { AgentChat } from "@/features/agent/agent-chat";

export const metadata = { title: "دستیار هوشمند — سفید و سیاه" };

export default function AgentPage() {
  return (
    <>
      <PageHeader
        title="دستیار هوشمند"
        description="با چت طبیعی، داده‌های پلتفرم را پرس‌وجو کنید یا عملیات نظارتی انجام دهید."
      />
      <PermissionGuard
        permission="agent.use"
        fallback={
          <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-muted-foreground text-sm">
            دسترسی به دستیار هوشمند برای حساب شما فعال نیست. از مدیر کل بخواهید
            مجوز <code dir="ltr">agent.use</code> را برای نقش شما اضافه کند.
          </div>
        }
      >
        <AgentChat />
      </PermissionGuard>
    </>
  );
}
