import { apiGet, apiList, apiPost } from "@/lib/axios";
import type { Notification } from "@/types";

export const notificationsService = {
  list(params: { page?: number; limit?: number; unreadOnly?: boolean } = {}) {
    return apiList<Notification>("/notifications", params);
  },
  unreadCount() {
    return apiGet<{ count: number }>("/notifications/unread-count");
  },
  markRead(id: string) {
    return apiPost<null>(`/notifications/${id}/read`);
  },
  markAllRead() {
    return apiPost<null>("/notifications/read-all");
  },
};
