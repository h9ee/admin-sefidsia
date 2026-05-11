"use client";

import { create } from "zustand";
import { env } from "@/config/env";
import { storage } from "@/lib/storage";

type Theme = "light" | "dark";

type ThemeState = {
  theme: Theme;
  hydrated: boolean;
  setTheme: (t: Theme) => void;
  toggle: () => void;
  init: () => void;
};

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", t === "dark");
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  hydrated: false,
  setTheme: (theme) => {
    storage.set(env.storageKey.theme, theme);
    applyTheme(theme);
    set({ theme });
  },
  toggle: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
  init: () => {
    if (typeof window === "undefined") return;
    const stored = storage.get(env.storageKey.theme) as Theme | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme: Theme = stored ?? (prefersDark ? "dark" : "light");
    applyTheme(theme);
    set({ theme, hydrated: true });
  },
}));
