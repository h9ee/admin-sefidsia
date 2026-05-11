"use client";

import { create } from "zustand";
import type { Notification } from "@/types";

type NotificationsState = {
  items: Notification[];
  setItems: (items: Notification[]) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  unreadCount: () => number;
};

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  setItems: (items) => set({ items }),
  markAllRead: () => set({ items: get().items.map((i) => ({ ...i, read: true })) }),
  markRead: (id) =>
    set({ items: get().items.map((i) => (i.id === id ? { ...i, read: true } : i)) }),
  unreadCount: () => get().items.filter((i) => !i.read).length,
}));
