"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { canAccessAdminPanel } from "@/lib/permissions";

/**
 * Lightweight client-side guard for the (admin) route group. The server-side
 * proxy.ts handles the cookie redirect; this just waits for the auth store to
 * hydrate before painting and bounces unauthenticated users back to /login.
 * Additionally, kicks out logged-in users whose role is outside the
 * admin-panel whitelist (developer / admin / moderator).
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const router = useRouter();
  const pathname = usePathname();

  const allowed = canAccessAdminPanel(user);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
      return;
    }
    if (!allowed) {
      // Strip session, drop the presence cookie that proxy.ts checks for, and
      // bounce. Toast explains why so it doesn't feel like a silent failure.
      clear();
      document.cookie = "ss-auth-presence=; Path=/; Max-Age=0; SameSite=Lax";
      toast.error("دسترسی شما به پنل مدیریت مجاز نیست.");
      router.replace("/login");
    }
  }, [hydrated, user, allowed, clear, router, pathname]);

  if (!hydrated || !user || !allowed) {
    return <LoadingOverlay label="در حال بررسی نشست…" />;
  }

  return <>{children}</>;
}
