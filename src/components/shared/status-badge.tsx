import { Badge } from "@/components/ui/badge";

const dictionary: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "muted" | "outline" | "secondary" }> = {
  active: { label: "فعال", variant: "success" },
  inactive: { label: "غیرفعال", variant: "muted" },
  pending: { label: "در انتظار", variant: "warning" },
  banned: { label: "مسدود", variant: "destructive" },
  draft: { label: "پیش‌نویس", variant: "muted" },
  published: { label: "منتشر شده", variant: "success" },
  review: { label: "نیازمند بازبینی", variant: "warning" },
  archived: { label: "بایگانی", variant: "outline" },
  open: { label: "باز", variant: "success" },
  closed: { label: "بسته", variant: "muted" },
  hidden: { label: "مخفی", variant: "destructive" },
  visible: { label: "قابل نمایش", variant: "success" },
  verified: { label: "تایید شده", variant: "success" },
  rejected: { label: "رد شده", variant: "destructive" },
  approved: { label: "تایید شده", variant: "success" },
  reviewed: { label: "بررسی شده", variant: "secondary" },
  actioned: { label: "اقدام شده", variant: "success" },
  dismissed: { label: "نادیده", variant: "muted" },
};

export function StatusBadge({ status }: { status: string }) {
  const entry = dictionary[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}
