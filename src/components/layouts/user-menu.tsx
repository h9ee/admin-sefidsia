"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, Settings as SettingsIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import { displayName, userInitials } from "@/lib/user";

export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const router = useRouter();

  const onLogout = async () => {
    await authService.logout();
    clear();
    router.replace("/login");
  };

  const name = displayName(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-2">
          <Avatar className="h-7 w-7">
            {user?.avatar ? <AvatarImage src={user.avatar} alt={name} /> : null}
            <AvatarFallback>{userInitials(user)}</AvatarFallback>
          </Avatar>
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-xs font-medium">{name}</p>
            <p className="text-[10px] text-muted-foreground">
              {user?.roles?.[0]?.name ?? "—"}
            </p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{user?.email ?? user?.mobile ?? user?.username ?? ""}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <UserIcon className="h-4 w-4" />
            پروفایل من
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <SettingsIcon className="h-4 w-4" />
            تنظیمات
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          خروج از حساب
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
