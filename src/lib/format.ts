const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"] as const;

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

export function formatNumber(value: number): string {
  return toPersianDigits(value.toLocaleString("en-US"));
}

export function formatRelativeTime(date: string | Date): string {
  const now = Date.now();
  const t = typeof date === "string" ? new Date(date).getTime() : date.getTime();
  const diff = Math.floor((now - t) / 1000);
  if (diff < 60) return "همین الان";
  if (diff < 3600) return `${toPersianDigits(Math.floor(diff / 60))} دقیقه پیش`;
  if (diff < 86400) return `${toPersianDigits(Math.floor(diff / 3600))} ساعت پیش`;
  if (diff < 2592000) return `${toPersianDigits(Math.floor(diff / 86400))} روز پیش`;
  return new Intl.DateTimeFormat("fa-IR").format(t);
}

export function formatDate(date: string | Date): string {
  const t = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(t);
}

export function formatDateTime(date: string | Date): string {
  const t = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(t);
}

export function slugify(text: string): string {
  return text
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^؀-ۿa-zA-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .toLowerCase();
}
