import type { ComponentType } from "react";
import type { Permission } from "@/types";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  KeyRound,
  Stethoscope,
  FileText,
  MessageSquare,
  MessageCircle,
  Tags,
  Flag,
  Bell,
  Trophy,
  Settings,
  Reply,
} from "lucide-react";

export type NavItem = {
  label: string;
  href?: string;
  icon: ComponentType<{ className?: string }>;
  permission?: Permission | Permission[];
  children?: NavItem[];
};

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
      { label: "نقش‌ها", href: "/roles", icon: ShieldCheck, permission: "roles.read" },
      {
        label: "دسترسی‌ها",
        href: "/permissions",
        icon: KeyRound,
        permission: "permissions.read",
      },
    ],
  },
  {
    label: "پزشکان",
    href: "/doctors",
    icon: Stethoscope,
    permission: "doctors.read",
  },
  {
    label: "محتوا",
    icon: FileText,
    children: [
      { label: "مقالات", href: "/articles", icon: FileText, permission: "articles.read" },
      { label: "سوالات", href: "/questions", icon: MessageSquare, permission: "questions.read" },
      { label: "پاسخ‌ها", href: "/answers", icon: Reply, permission: "answers.read" },
      { label: "نظرات", href: "/comments", icon: MessageCircle, permission: "comments.read" },
      { label: "برچسب‌ها", href: "/tags", icon: Tags, permission: "tags.read" },
    ],
  },
  {
    label: "گزارش‌ها و نظارت",
    href: "/reports",
    icon: Flag,
    permission: ["reports.read", "reports.manage"],
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
    permission: "gamification.read",
  },
  {
    label: "تنظیمات",
    href: "/settings",
    icon: Settings,
  },
];
