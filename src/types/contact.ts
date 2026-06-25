export type ContactMessage = {
  id: number;
  name: string;
  mobile: string;
  subject: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContactReadFilter = "all" | "unread" | "read";
