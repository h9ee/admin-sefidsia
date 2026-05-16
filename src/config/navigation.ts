import type { ComponentType } from "react";
import type { PermissionSlug } from "@/types";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  KeyRound,
  Stethoscope,
  FileText,
  FolderTree,
  MessageSquare,
  MessageCircle,
  Tags,
  Flag,
  Bell,
  Trophy,
  Settings,
  Reply,
  ShieldAlert,
  History,
  LifeBuoy,
} from "lucide-react";

export type NavItem = {
  label: string;
  href?: string;
  icon: ComponentType<{ className?: string }>;
  permission?: PermissionSlug | PermissionSlug[];
  children?: NavItem[];
};

/**
 * Navigation tree. Permission slugs mirror the backend seeder
 * (`back-sefidsia/src/seeders/data/permissions.ts`). Items without a
 * `permission` are visible to any authenticated user (e.g. dashboard, settings).
 */
export const navigation: NavItem[] = [
  {
    label: "داشبورد",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "کاربران",
    icon: Users,
    children: [
      { label: "همه کاربران", href: "/users", icon: Users, permission: "users.read" },
      { label: "نقش‌ها", href: "/roles", icon: ShieldCheck, permission: "roles.manage" },
      {
        label: "دسترسی‌ها",
        href: "/permissions",
        icon: KeyRound,
        permission: "permissions.manage",
      },
    ],
  },
  {
    label: "پزشکان",
    href: "/doctors",
    icon: Stethoscope,
  },
  {
    label: "محتوا",
    icon: FileText,
    children: [
      { label: "مقالات", href: "/articles", icon: FileText },
      {
        label: "دسته‌بندی‌ها",
        href: "/categories",
        icon: FolderTree,
        permission: "categories.manage",
      },
      { label: "سوالات", href: "/questions", icon: MessageSquare },
      { label: "پاسخ‌ها", href: "/answers", icon: Reply },
      { label: "نظرات", href: "/comments", icon: MessageCircle },
      { label: "برچسب‌ها", href: "/tags", icon: Tags },
    ],
  },
  {
    label: "تیکت‌ها",
    href: "/tickets",
    icon: LifeBuoy,
    permission: "tickets.read",
  },
  {
    label: "گزارش‌ها و نظارت",
    href: "/reports",
    icon: Flag,
    permission: ["reports.manage", "moderation.manage"],
  },
  {
    label: "اعلان‌ها",
    href: "/notifications",
    icon: Bell,
  },
  {
    label: "گیمیفیکیشن",
    href: "/gamification",
    icon: Trophy,
  },
  {
    label: "لاگ خطاها",
    href: "/error-logs",
    icon: ShieldAlert,
    permission: "errorLogs.manage",
  },
  {
    label: "لاگ تغییرات",
    href: "/audit",
    icon: History,
    permission: "audit.read",
  },
  {
    label: "تنظیمات",
    href: "/settings",
    icon: Settings,
  },
];
