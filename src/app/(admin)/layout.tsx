import type { ReactNode } from "react";
import { AdminShell } from "@/components/layouts/admin-layout";
import { AuthGate } from "@/components/layouts/auth-gate";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <AdminShell>{children}</AdminShell>
    </AuthGate>
  );
}
