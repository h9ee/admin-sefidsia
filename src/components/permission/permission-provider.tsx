"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";

/**
 * Hydrates the auth session from /auth/me on mount when an access token exists,
 * so permissions stay fresh after a hard reload. Children always render.
 */
export function PermissionProvider({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setSession = useAuthStore((s) => s.setSession);
  const clear = useAuthStore((s) => s.clear);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("ss-access-token");
    if (!token) return;
    let active = true;
    authService
      .me()
      .then((res) => {
        if (!active) return;
        setSession({
          user: res.user,
          permissions: res.permissions,
          accessToken: token,
          refreshToken: window.localStorage.getItem("ss-refresh-token") ?? "",
        });
        setUser(res.user);
      })
      .catch(() => {
        if (!active) return;
        clear();
      });
    return () => {
      active = false;
    };
  }, [hydrated, setUser, setSession, clear]);

  return <>{children}</>;
}
