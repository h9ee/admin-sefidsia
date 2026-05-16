import { apiDelete, apiGet, apiList, apiPatch, apiPost } from "@/lib/axios";
import type {
  Ticket,
  TicketActivity,
  TicketMessage,
  TicketStats,
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from "@/types/ticket";
import type { User } from "@/types/auth";

export interface ListTicketsParams {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assignedTo?: number;
  userId?: number;
  q?: string;
  unassigned?: boolean;
  mine?: boolean;
  sortBy?: "createdAt" | "lastActivityAt" | "priority";
  sortOrder?: "ASC" | "DESC";
}

export interface CreateTicketPayload {
  subject: string;
  description: string;
  priority?: TicketPriority;
  category?: TicketCategory;
}

export interface ReplyTicketPayload {
  body: string;
  isInternalNote?: boolean;
}

export interface UpdateTicketPayload {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assignedTo?: number | null;
}

export const ticketsService = {
  list: (params?: ListTicketsParams) =>
    apiList<Ticket>("/tickets", params as Record<string, unknown> | undefined),
  get: (id: number | string) => apiGet<Ticket>(`/tickets/${id}`),
  activities: (id: number | string) =>
    apiGet<TicketActivity[]>(`/tickets/${id}/activities`),
  create: (payload: CreateTicketPayload) =>
    apiPost<Ticket>("/tickets", payload),
  reply: (id: number | string, payload: ReplyTicketPayload) =>
    apiPost<TicketMessage>(`/tickets/${id}/messages`, payload),
  update: (id: number | string, payload: UpdateTicketPayload) =>
    apiPatch<Ticket>(`/tickets/${id}`, payload),
  assign: (id: number | string, assignedTo: number | null) =>
    apiPost<Ticket>(`/tickets/${id}/assign`, { assignedTo }),
  close: (id: number | string) => apiPost<Ticket>(`/tickets/${id}/close`),
  rate: (id: number | string, payload: { rating: number; feedback?: string }) =>
    apiPost<Ticket>(`/tickets/${id}/rate`, payload),
  remove: (id: number | string) => apiDelete<null>(`/tickets/${id}`),
  stats: () => apiGet<TicketStats>("/tickets/stats"),
  staff: () =>
    apiGet<Pick<User, "id" | "username" | "firstName" | "lastName" | "userType" | "avatar">[]>(
      "/tickets/staff"
    ),
};
