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
  Sparkles,
} from "lucide-react";

export type NavItem = {
  label: string;
  href?: string;
  icon: ComponentType<{ className?: string }>;
  permission?: PermissionSlug | PermissionSlug[];
  children?: NavItem[];
  /** Optional badge key — used by sidebar to render a live counter. */
  badge?: "tickets" | "reports" | "notifications";
};

export type NavSection = {
  /** If omitted, items render without a header (use for the first/dashboard block). */
  label?: string;
  items: NavItem[];
};

/**
 * Navigation tree. Permission slugs mirror the backend seeder
 * (`back-sefidsia/src/seeders/data/permissions.ts`). Items without a
 * `permission` are visible to any authenticated user.
 */
export const navigation: NavSection[] = [
  {
    items: [
      { label: "داشبورد", href: "/dashboard", icon: LayoutDashboard },
      {
        label: "دستیار هوشمند",
        href: "/agent",
        icon: Sparkles,
        permission: "agent.use",
      },
    ],
  },
  {
    label: "مدیریت کاربران",
    items: [
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
      { label: "پزشکان", href: "/doctors", icon: Stethoscope, permission: "doctors.verify" },
    ],
  },
  {
    label: "محتوا",
    items: [
      { label: "مقالات", href: "/articles", icon: FileText, permission: "articles.read" },
      {
        label: "دسته‌بندی‌ها",
        href: "/categories",
        icon: FolderTree,
        permission: "categories.manage",
      },
      { label: "سوالات", href: "/questions", icon: MessageSquare, permission: "questions.read" },
      {
        label: "پاسخ‌ها",
        href: "/answers",
        icon: Reply,
        permission: ["answers.read", "answers.update"],
      },
      {
        label: "نظرات",
        href: "/comments",
        icon: MessageCircle,
        permission: ["comments.read", "comments.update", "comments.delete", "moderation.manage"],
      },
      { label: "برچسب‌ها", href: "/tags", icon: Tags, permission: "tags.manage" },
    ],
  },
  {
    label: "ارتباط و پشتیبانی",
    items: [
      {
        label: "تیکت‌ها",
        href: "/tickets",
        icon: LifeBuoy,
        permission: "tickets.read",
        badge: "tickets",
      },
      { label: "اعلان‌ها", href: "/notifications", icon: Bell, badge: "notifications" },
    ],
  },
  {
    label: "نظارت",
    items: [
      {
        label: "گزارش‌ها",
        href: "/reports",
        icon: Flag,
        permission: ["reports.manage", "moderation.manage"],
        badge: "reports",
      },
      { label: "گیمیفیکیشن", href: "/gamification", icon: Trophy, permission: "users.read" },
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
    ],
  },
  {
    label: "سیستم",
    items: [
      { label: "تنظیمات", href: "/settings", icon: Settings },
    ],
  },
];

/**
 * Resolve the permission(s) required to view a given pathname, by matching the
 * most specific nav item whose `href` prefixes the path. Returns `undefined`
 * for routes that carry no permission (open to any authenticated admin user).
 * Used by the route guard to 403 direct URL access.
 */
export function resolveNavPermission(
  pathname: string,
): PermissionSlug | PermissionSlug[] | undefined {
  let bestHref = "";
  let bestPermission: PermissionSlug | PermissionSlug[] | undefined;

  const visit = (items: NavItem[]): void => {
    for (const item of items) {
      if (item.href) {
        const matches =
          pathname === item.href || pathname.startsWith(item.href + "/");
        if (matches && item.href.length > bestHref.length) {
          bestHref = item.href;
          bestPermission = item.permission;
        }
      }
      if (item.children) visit(item.children);
    }
  };

  for (const section of navigation) visit(section.items);
  return bestPermission;
}
