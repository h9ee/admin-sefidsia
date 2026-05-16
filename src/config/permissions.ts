import type { Permission, PermissionGroup } from "@/types";

/**
 * Backend-mirrored permission catalog (see `back-sefidsia/src/seeders/data/permissions.ts`).
 * Used as a fallback when grouping `/permissions` results by module.
 */
const fallbackPermissions: Omit<Permission, "id" | "createdAt" | "updatedAt">[] = [
  { slug: "users.read", name: "مشاهده کاربران", module: "users", action: "read" },
  { slug: "users.create", name: "ایجاد کاربر", module: "users", action: "create" },
  { slug: "users.update", name: "ویرایش کاربر", module: "users", action: "update" },
  { slug: "users.delete", name: "حذف کاربر", module: "users", action: "delete" },
  { slug: "roles.manage", name: "مدیریت نقش‌ها", module: "roles", action: "manage" },
  { slug: "permissions.manage", name: "مدیریت دسترسی‌ها", module: "permissions", action: "manage" },
  { slug: "articles.read", name: "مشاهده مقالات", module: "articles", action: "read" },
  { slug: "articles.create", name: "ایجاد مقاله", module: "articles", action: "create" },
  { slug: "articles.update", name: "ویرایش مقاله", module: "articles", action: "update" },
  { slug: "articles.delete", name: "حذف مقاله", module: "articles", action: "delete" },
  { slug: "articles.publish", name: "انتشار مقاله", module: "articles", action: "publish" },
  { slug: "articles.review", name: "بررسی مقاله", module: "articles", action: "review" },
  { slug: "questions.read", name: "مشاهده سؤالات", module: "questions", action: "read" },
  { slug: "questions.create", name: "ایجاد سؤال", module: "questions", action: "create" },
  { slug: "questions.update", name: "ویرایش سؤال", module: "questions", action: "update" },
  { slug: "questions.delete", name: "حذف سؤال", module: "questions", action: "delete" },
  { slug: "answers.create", name: "پاسخ‌گویی", module: "answers", action: "create" },
  { slug: "answers.update", name: "ویرایش پاسخ", module: "answers", action: "update" },
  { slug: "answers.delete", name: "حذف پاسخ", module: "answers", action: "delete" },
  { slug: "comments.create", name: "ارسال کامنت", module: "comments", action: "create" },
  { slug: "comments.update", name: "ویرایش کامنت", module: "comments", action: "update" },
  { slug: "comments.delete", name: "حذف کامنت", module: "comments", action: "delete" },
  { slug: "tags.manage", name: "مدیریت برچسب‌ها", module: "tags", action: "manage" },
  { slug: "categories.manage", name: "مدیریت دسته‌بندی‌ها", module: "categories", action: "manage" },
  { slug: "doctors.verify", name: "تأیید پزشک", module: "doctors", action: "verify" },
  { slug: "reports.manage", name: "مدیریت گزارش‌ها", module: "reports", action: "manage" },
  { slug: "moderation.manage", name: "مدیریت نظارت", module: "moderation", action: "manage" },
  { slug: "leaderboard.manage", name: "مدیریت لیدربورد", module: "leaderboard", action: "manage" },
  { slug: "notifications.manage", name: "مدیریت اعلان‌ها", module: "notifications", action: "manage" },
  { slug: "audit.read", name: "مشاهده لاگ تغییرات", module: "audit", action: "read" },
];

const MODULE_LABELS: Record<string, string> = {
  users: "کاربران",
  roles: "نقش‌ها",
  permissions: "دسترسی‌ها",
  articles: "مقالات",
  questions: "سؤالات",
  answers: "پاسخ‌ها",
  comments: "نظرات",
  tags: "برچسب‌ها",
  categories: "دسته‌بندی‌ها",
  doctors: "پزشکان",
  reports: "گزارش‌ها",
  moderation: "نظارت",
  leaderboard: "لیدربورد",
  notifications: "اعلان‌ها",
  audit: "لاگ تغییرات",
};

export function groupPermissions(items: Permission[]): PermissionGroup[] {
  const byModule = new Map<string, Permission[]>();
  for (const p of items) {
    const list = byModule.get(p.module) ?? [];
    list.push(p);
    byModule.set(p.module, list);
  }
  return Array.from(byModule.entries()).map(([key, permissions]) => ({
    key,
    label: MODULE_LABELS[key] ?? key,
    permissions,
  }));
}

export const fallbackPermissionGroups: PermissionGroup[] = groupPermissions(
  fallbackPermissions.map((p, i) => ({ ...p, id: `fb-${i}` })),
);
