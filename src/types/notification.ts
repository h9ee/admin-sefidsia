export type NotificationKind =
  | "system"
  | "report"
  | "user"
  | "article"
  | "question"
  | "doctor";

export type Notification = {
  id: string;
  title: string;
  body?: string;
  kind: NotificationKind;
  read: boolean;
  url?: string;
  createdAt: string;
};
