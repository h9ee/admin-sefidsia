"use client";

import { type ReactNode } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { useSidebarStore } from "@/store/sidebar.store";
import { cn } from "@/lib/cn";

export function AdminShell({ children }: { children: ReactNode }) {
  const collapsed = useSidebarStore((s) => s.collapsed);
  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-l border-border transition-[width] duration-200 lg:block",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <Sidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 px-3 py-4 sm:px-4 sm:py-6">
          <div className="mx-auto w-full max-w-7xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
