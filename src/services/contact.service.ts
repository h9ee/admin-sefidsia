import { apiDelete, apiGet, apiList, apiPatch } from "@/lib/axios";
import type { ContactMessage, ContactReadFilter } from "@/types";

export type ContactQuery = {
  page?: number;
  limit?: number;
  q?: string;
  read?: ContactReadFilter;
};

export const contactService = {
  list(params: ContactQuery = {}) {
    return apiList<ContactMessage>("/contact", params);
  },
  get(id: number | string) {
    return apiGet<ContactMessage>(`/contact/${id}`);
  },
  setRead(id: number | string, isRead: boolean) {
    return apiPatch<ContactMessage>(`/contact/${id}/read`, { isRead });
  },
  remove(id: number | string) {
    return apiDelete(`/contact/${id}`);
  },
};
