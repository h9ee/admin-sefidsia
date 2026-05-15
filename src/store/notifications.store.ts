"use client";

import { create } from "zustand";
import type { Notification } from "@/types";

type NotificationsState = {
  items: Notification[];
  unread: number;
  setItems: (items: Notification[]) => void;
  setUnread: (n: number) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
};

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  unread: 0,
  setItems: (items) =>
    set({ items, unread: items.filter((i) => !i.isRead).length }),
  setUnread: (n) => set({ unread: n }),
  markAllRead: () =>
    set({ items: get().items.map((i) => ({ ...i, isRead: true })), unread: 0 }),
  markRead: (id) => {
    const items = get().items.map((i) => (i.id === id ? { ...i, isRead: true } : i));
    set({ items, unread: items.filter((i) => !i.isRead).length });
  },
}));
