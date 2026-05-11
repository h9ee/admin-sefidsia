"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Home } from "lucide-react";
import { Fragment, useMemo } from "react";

const labels: Record<string, string> = {
  dashboard: "داشبورد",
  users: "کاربران",
  roles: "نقش‌ها",
  permissions: "دسترسی‌ها",
  doctors: "پزشکان",
  articles: "مقالات",
  questions: "سوالات",
  answers: "پاسخ‌ها",
  comments: "نظرات",
  tags: "برچسب‌ها",
  reports: "گزارش‌ها",
  notifications: "اعلان‌ها",
  gamification: "گیمیفیکیشن",
  settings: "تنظیمات",
  new: "جدید",
  edit: "ویرایش",
};

export function Breadcrumb() {
  const pathname = usePathname();
  const items = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    return parts.map((part, idx) => ({
      href: "/" + parts.slice(0, idx + 1).join("/"),
      label: labels[part] ?? part,
    }));
  }, [pathname]);

  return (
    <nav className="flex items-center gap-1 text-xs text-muted-foreground" aria-label="مسیر">
      <Link href="/dashboard" className="inline-flex items-center gap-1 hover:text-foreground">
        <Home className="h-3.5 w-3.5" />
        خانه
      </Link>
      {items.map((item, i) => (
        <Fragment key={item.href}>
          <ChevronLeft className="h-3.5 w-3.5 opacity-60" />
          {i === items.length - 1 ? (
            <span className="text-foreground">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
