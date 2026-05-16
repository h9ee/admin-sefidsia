import type { User } from "./auth";

export type TicketStatus =
  | "open"
  | "in_progress"
  | "awaiting_user"
  | "resolved"
  | "closed";

export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type TicketCategory =
  | "general"
  | "technical"
  | "billing"
  | "medical_inquiry"
  | "account"
  | "feedback"
  | "bug"
  | "other";

export type TicketAction =
  | "created"
  | "replied"
  | "note_added"
  | "status_changed"
  | "priority_changed"
  | "category_changed"
  | "assigned"
  | "unassigned"
  | "reopened"
  | "closed"
  | "rated";

export interface TicketAttachment {
  url: string;
  name?: string;
  size?: number;
  mime?: string;
}

export interface TicketMessage {
  id: number;
  ticketId: number;
  userId: number;
  body: string;
  isInternalNote: boolean;
  attachments: TicketAttachment[] | null;
  createdAt: string;
  author?: Pick<User, "id" | "username" | "firstName" | "lastName" | "avatar" | "userType">;
}

export interface TicketActivity {
  id: number;
  ticketId: number;
  actorId: number | null;
  action: TicketAction;
  payload: Record<string, unknown> | null;
  createdAt: string;
  actor?: Pick<User, "id" | "username" | "firstName" | "lastName" | "avatar" | "userType">;
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  userId: number;
  assignedTo: number | null;
  firstResponseAt: string | null;
  lastActivityAt: string;
  closedAt: string | null;
  closedBy: number | null;
  userRating: number | null;
  userFeedback: string | null;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  requester?: Pick<User, "id" | "username" | "firstName" | "lastName" | "avatar" | "mobile">;
  assignee?: Pick<User, "id" | "username" | "firstName" | "lastName" | "avatar"> | null;
  messages?: TicketMessage[];
}

export interface TicketStats {
  open: number;
  unassigned: number;
  createdLast7: number;
  avgRating: number | null;
  byStatus: { status: TicketStatus; count: number }[];
  byPriority: { priority: TicketPriority; count: number }[];
}
