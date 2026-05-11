"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Permission, User } from "@/types";
import { env } from "@/config/env";
import { storage } from "@/lib/storage";

type AuthState = {
  user: User | null;
  permissions: Permission[];
  hydrated: boolean;
  setSession: (payload: {
    user: User;
    permissions: Permission[];
    accessToken: string;
    refreshToken: string;
  }) => void;
  setUser: (user: User) => void;
  clear: () => void;
  setHydrated: (v: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      permissions: [],
      hydrated: false,
      setSession: ({ user, permissions, accessToken, refreshToken }) => {
        storage.set(env.storageKey.accessToken, accessToken);
        storage.set(env.storageKey.refreshToken, refreshToken);
        set({ user, permissions });
      },
      setUser: (user) => set({ user }),
      clear: () => {
        storage.remove(env.storageKey.accessToken);
        storage.remove(env.storageKey.refreshToken);
        set({ user: null, permissions: [] });
      },
      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: "ss-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, permissions: s.permissions }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
