"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { LoadingOverlay } from "@/components/shared/loading-overlay";

/**
 * Lightweight client-side guard for the (admin) route group. The server-side
 * proxy.ts handles the cookie redirect; this just waits for the auth store to
 * hydrate before painting and bounces unauthenticated users back to /login.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
    }
  }, [hydrated, user, router, pathname]);

  if (!hydrated || !user) {
    return <LoadingOverlay label="در حال بررسی نشست…" />;
  }

  return <>{children}</>;
}
