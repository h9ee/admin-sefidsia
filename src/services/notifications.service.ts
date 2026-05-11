import { api } from "@/lib/axios";
import type { Notification, Paginated } from "@/types";

export const notificationsService = {
  async list(params: { page?: number; perPage?: number; read?: boolean } = {}) {
    const { data } = await api.get<Paginated<Notification>>("/admin/notifications", { params });
    return data;
  },
  async markAllRead() {
    await api.post("/admin/notifications/read-all");
  },
  async markRead(id: string) {
    await api.post(`/admin/notifications/${id}/read`);
  },
};
