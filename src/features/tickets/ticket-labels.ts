import type {
  TicketAction,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/types/ticket";

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "باز",
  in_progress: "در حال بررسی",
  awaiting_user: "در انتظار پاسخ کاربر",
  resolved: "حل‌شده",
  closed: "بسته‌شده",
};

export const STATUS_VARIANT: Record<
  TicketStatus,
  "success" | "warning" | "destructive" | "muted" | "outline" | "secondary"
> = {
  open: "success",
  in_progress: "warning",
  awaiting_user: "secondary",
  resolved: "outline",
  closed: "muted",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "کم",
  normal: "عادی",
  high: "زیاد",
  urgent: "اضطراری",
};

export const PRIORITY_VARIANT: Record<
  TicketPriority,
  "muted" | "secondary" | "warning" | "destructive"
> = {
  low: "muted",
  normal: "secondary",
  high: "warning",
  urgent: "destructive",
};

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  general: "عمومی",
  technical: "فنی",
  billing: "مالی",
  medical_inquiry: "پرسش پزشکی",
  account: "حساب کاربری",
  feedback: "بازخورد",
  bug: "گزارش باگ",
  other: "سایر",
};

export const ACTION_LABELS: Record<TicketAction, string> = {
  created: "تیکت ایجاد شد",
  replied: "پاسخ ثبت شد",
  note_added: "یادداشت داخلی اضافه شد",
  status_changed: "وضعیت تغییر کرد",
  priority_changed: "اولویت تغییر کرد",
  category_changed: "دسته‌بندی تغییر کرد",
  assigned: "واگذار شد",
  unassigned: "واگذاری لغو شد",
  reopened: "بازگشایی شد",
  closed: "بسته شد",
  rated: "امتیازدهی انجام شد",
};

export function userFullName(u?: {
  firstName?: string | null;
  lastName?: string | null;
  username?: string;
}): string {
  if (!u) return "—";
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return name || u.username || "—";
}
