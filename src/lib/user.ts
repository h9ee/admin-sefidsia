import type { User } from "@/types";

export function displayName(user: User | null | undefined): string {
  if (!user) return "کاربر مهمان";
  const fn = user.firstName?.trim();
  const ln = user.lastName?.trim();
  if (fn || ln) return [fn, ln].filter(Boolean).join(" ");
  return user.username;
}

export function userInitials(user: User | null | undefined): string {
  if (!user) return "؟";
  const fn = user.firstName?.trim();
  const ln = user.lastName?.trim();
  if (fn || ln) return [fn?.[0], ln?.[0]].filter(Boolean).join("");
  return user.username[0]?.toUpperCase() ?? "؟";
}
