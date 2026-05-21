"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import { parseApiError } from "@/lib/api-error";
import { env } from "@/config/env";
import { storage } from "@/lib/storage";

/**
 * Hydrates the auth session from /auth/me on mount when an access token exists,
 * so permissions stay fresh after a hard reload. Children always render.
 */
export function PermissionProvider({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    const token = storage.get(env.storageKey.accessToken);
    if (!token) return;
    let active = true;
    authService
      .me()
      .then((user) => {
        if (!active) return;
        setUser(user);
      })
      .catch((err) => {
        if (!active) return;
        // Only drop the session on a definitive auth failure (the interceptor
        // already tried — and failed — to refresh the token). A transient
        // network/server error must NOT log the admin out.
        const status = parseApiError(err).status;
        if (status === 401 || status === 403) clear();
      });
    return () => {
      active = false;
    };
  }, [hydrated, setUser, clear]);

  return <>{children}</>;
}
