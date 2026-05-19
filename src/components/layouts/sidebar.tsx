"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, PanelRightClose, PanelLeftClose } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { navigation, type NavItem, type NavSection } from "@/config/navigation";
import { useSidebarStore } from "@/store/sidebar.store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Sidebar({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggleCollapsed);

  // Show all items unconditionally. The backend enforces access on each API
  // call — sidebar visibility is intentionally permissive so admins always
  // see the full surface of the panel.
  const sections: NavSection[] = navigation;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card text-card-foreground">
      <div
        className={cn(
          "relative flex h-16 shrink-0 items-center border-b border-border px-4",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {collapsed ? (
          <Logo only />
        ) : (
          <>
            <Logo />
            <button
              type="button"
              onClick={toggle}
              className="hidden rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:inline-flex"
              aria-label="بستن سایدبار"
            >
              <PanelRightClose className="h-4 w-4" />
            </button>
          </>
        )}
        {collapsed ? (
          <button
            type="button"
            onClick={toggle}
            className="absolute -left-3 top-5 hidden rounded-full border border-border bg-card p-1 text-muted-foreground shadow transition-colors hover:text-foreground lg:inline-flex"
            aria-label="باز کردن سایدبار"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {sections.map((section, idx) => (
          <SectionBlock
            key={section.label ?? `s-${idx}`}
            section={section}
            pathname={pathname}
            collapsed={collapsed}
            onItemClick={onItemClick}
            isFirst={idx === 0}
          />
        ))}
      </nav>

      <div
        className={cn(
          "shrink-0 border-t border-border px-3 py-3 text-xs text-muted-foreground",
          collapsed && "flex justify-center",
        )}
      >
        {collapsed ? (
          <span className="font-bold text-foreground/60">س</span>
        ) : (
          <div className="flex items-center justify-between">
            <span>سفید و سیاه</span>
            <span className="text-[10px] opacity-60">v1.0</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionBlock({
  section,
  pathname,
  collapsed,
  onItemClick,
  isFirst,
}: {
  section: NavSection;
  pathname: string;
  collapsed: boolean;
  onItemClick?: () => void;
  isFirst: boolean;
}) {
  return (
    <div className={cn("space-y-0.5", !isFirst && (collapsed ? "mt-3" : "mt-4"))}>
      {section.label && !collapsed ? (
        <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {section.label}
        </p>
      ) : null}
      {section.label && collapsed ? (
        <div className="mx-auto mb-1 h-px w-6 bg-border" />
      ) : null}
      {section.items.map((item) => (
        <NavItemRow
          key={item.label}
          item={item}
          pathname={pathname}
          collapsed={collapsed}
          onItemClick={onItemClick}
        />
      ))}
    </div>
  );
}

function Logo({ only }: { only?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
        <span className="text-sm font-bold">س</span>
      </div>
      {!only ? (
        <div className="leading-tight">
          <p className="text-sm font-semibold">سفید و سیاه</p>
          <p className="text-[10px] text-muted-foreground">پنل مدیریت</p>
        </div>
      ) : null}
    </Link>
  );
}

function Badge({ count, active }: { count: number; active?: boolean }) {
  if (!count) return null;
  return (
    <span
      className={cn(
        "ms-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
        active
          ? "bg-primary-foreground/20 text-primary-foreground"
          : "bg-destructive/15 text-destructive",
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavItemRow({
  item,
  pathname,
  collapsed,
  onItemClick,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onItemClick?: () => void;
}) {
  const hasChildren = !!item.children?.length;
  const active = item.href
    ? pathname === item.href || pathname.startsWith(item.href + "/")
    : false;
  const childActive = item.children?.some((c) =>
    c.href ? pathname === c.href || pathname.startsWith(c.href + "/") : false,
  );
  const [open, setOpen] = useState<boolean>(!!childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  // Static placeholder counts. Wire to real data via a `useBadgeCounts` hook
  // once endpoints exist (e.g. pending tickets, unread notifications).
  const badgeCount = 0;

  if (!hasChildren && item.href) {
    const button = (
      <Link
        href={item.href}
        onClick={onItemClick}
        className={cn(
          "group relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-colors",
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-foreground/75 hover:bg-accent hover:text-foreground",
          collapsed && "justify-center px-0",
        )}
      >
        {active && !collapsed ? (
          <span className="absolute inset-y-1.5 right-0 w-0.5 rounded-full bg-primary-foreground/80" />
        ) : null}
        <item.icon
          className={cn(
            "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
            active && "scale-110",
          )}
        />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && item.badge ? <Badge count={badgeCount} active={active} /> : null}
        {collapsed && item.badge && badgeCount > 0 ? (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
        ) : null}
      </Link>
    );
    return collapsed ? (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="left">{item.label}</TooltipContent>
      </Tooltip>
    ) : (
      button
    );
  }

  if (hasChildren) {
    const button = (
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "group flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-colors",
          childActive
            ? "bg-accent/60 text-foreground"
            : "text-foreground/75 hover:bg-accent hover:text-foreground",
          collapsed && "justify-center px-0",
        )}
      >
        <item.icon
          className={cn(
            "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
            childActive && "scale-110",
          )}
        />
        {!collapsed && (
          <>
            <span className="truncate">{item.label}</span>
            <ChevronLeft
              className={cn(
                "ms-auto h-4 w-4 text-muted-foreground transition-transform",
                open && "-rotate-90",
              )}
            />
          </>
        )}
      </button>
    );

    return (
      <div className="space-y-0.5">
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side="left">{item.label}</TooltipContent>
          </Tooltip>
        ) : (
          button
        )}
        <AnimatePresence initial={false}>
          {open && !collapsed ? (
            <motion.div
              key="submenu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="ms-2 mt-0.5 space-y-0.5 border-r border-border pe-2 ps-1.5">
                {item.children!.map((child) => {
                  if (!child.href) return null;
                  const isActive =
                    pathname === child.href || pathname.startsWith(child.href + "/");
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onItemClick}
                      className={cn(
                        "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-xs transition-colors",
                        isActive
                          ? "bg-primary/10 font-medium text-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full transition-colors",
                          isActive ? "bg-primary" : "bg-border",
                        )}
                      />
                      <span className="truncate">{child.label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}
