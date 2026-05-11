"use client";

import { Menu, Search } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Sidebar } from "./sidebar";
import { NotificationsDropdown } from "./notifications-dropdown";
import { UserMenu } from "./user-menu";
import { useSidebarStore } from "@/store/sidebar.store";

export function Header() {
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-3 backdrop-blur-sm sm:px-4">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="باز کردن منو">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 p-0">
          <Sidebar onItemClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="hidden flex-1 lg:block">
        <Breadcrumb />
      </div>

      <div className="relative hidden w-full max-w-sm md:block">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="جستجوی سریع…" className="pe-9" />
      </div>

      <div className="ms-auto flex items-center gap-2">
        <ThemeToggle />
        <NotificationsDropdown />
        <UserMenu />
      </div>
    </header>
  );
}
