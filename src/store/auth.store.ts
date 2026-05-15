"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { TokenPair, User } from "@/types";
import { env } from "@/config/env";
import { storage } from "@/lib/storage";

type AuthState = {
  user: User | null;
  hydrated: boolean;
  setSession: (payload: { user: User; tokens: TokenPair }) => void;
  setUser: (user: User) => void;
  setTokens: (tokens: TokenPair) => void;
  clear: () => void;
  setHydrated: (v: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
      setSession: ({ user, tokens }) => {
        storage.set(env.storageKey.accessToken, tokens.accessToken);
        storage.set(env.storageKey.refreshToken, tokens.refreshToken);
        set({ user });
      },
      setUser: (user) => set({ user }),
      setTokens: (tokens) => {
        storage.set(env.storageKey.accessToken, tokens.accessToken);
        storage.set(env.storageKey.refreshToken, tokens.refreshToken);
      },
      clear: () => {
        storage.remove(env.storageKey.accessToken);
        storage.remove(env.storageKey.refreshToken);
        if (typeof document !== "undefined") {
          document.cookie = "ss-auth-presence=; Path=/; Max-Age=0";
        }
        set({ user: null });
      },
      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: "ss-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
