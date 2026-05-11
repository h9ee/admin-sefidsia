import type { PermissionGroup } from "@/types";

/**
 * Default permission catalog used in the role editor when the API does not
 * expose `/admin/permissions`. Always merged with what the backend returns.
 */
export const defaultPermissionGroups: PermissionGroup[] = [
  {
    key: "users",
    label: "کاربران",
    permissions: [
      { key: "users.read", label: "مشاهده کاربران" },
      { key: "users.create", label: "ایجاد کاربر" },
      { key: "users.update", label: "ویرایش کاربر" },
      { key: "users.delete", label: "حذف کاربر" },
    ],
  },
  {
    key: "roles",
    label: "نقش‌ها",
    permissions: [
      { key: "roles.read", label: "مشاهده نقش‌ها" },
      { key: "roles.create", label: "ایجاد نقش" },
      { key: "roles.update", label: "ویرایش نقش" },
      { key: "roles.delete", label: "حذف نقش" },
    ],
  },
  {
    key: "doctors",
    label: "پزشکان",
    permissions: [
      { key: "doctors.read", label: "مشاهده پزشکان" },
      { key: "doctors.verify", label: "تایید پزشک" },
      { key: "doctors.reject", label: "رد پزشک" },
    ],
  },
  {
    key: "articles",
    label: "مقالات",
    permissions: [
      { key: "articles.read", label: "مشاهده مقالات" },
      { key: "articles.create", label: "ایجاد مقاله" },
      { key: "articles.update", label: "ویرایش مقاله" },
      { key: "articles.delete", label: "حذف مقاله" },
      { key: "articles.publish", label: "انتشار مقاله" },
    ],
  },
  {
    key: "questions",
    label: "سوالات",
    permissions: [
      { key: "questions.read", label: "مشاهده سوالات" },
      { key: "questions.update", label: "ویرایش سوال" },
      { key: "questions.delete", label: "حذف سوال" },
      { key: "questions.moderate", label: "نظارت بر سوالات" },
    ],
  },
  {
    key: "answers",
    label: "پاسخ‌ها",
    permissions: [
      { key: "answers.read", label: "مشاهده پاسخ‌ها" },
      { key: "answers.update", label: "ویرایش پاسخ" },
      { key: "answers.delete", label: "حذف پاسخ" },
    ],
  },
  {
    key: "comments",
    label: "نظرات",
    permissions: [
      { key: "comments.read", label: "مشاهده نظرات" },
      { key: "comments.update", label: "ویرایش نظر" },
      { key: "comments.delete", label: "حذف نظر" },
    ],
  },
  {
    key: "tags",
    label: "برچسب‌ها",
    permissions: [
      { key: "tags.read", label: "مشاهده برچسب‌ها" },
      { key: "tags.create", label: "ایجاد برچسب" },
      { key: "tags.update", label: "ویرایش برچسب" },
      { key: "tags.delete", label: "حذف برچسب" },
    ],
  },
  {
    key: "reports",
    label: "گزارش‌ها",
    permissions: [
      { key: "reports.read", label: "مشاهده گزارش‌ها" },
      { key: "reports.manage", label: "مدیریت گزارش‌ها" },
    ],
  },
  {
    key: "gamification",
    label: "گیمیفیکیشن",
    permissions: [
      { key: "gamification.read", label: "مشاهده گیمیفیکیشن" },
      { key: "gamification.update", label: "ویرایش گیمیفیکیشن" },
    ],
  },
];
