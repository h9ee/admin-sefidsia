"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, PanelRightClose, PanelLeftClose } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/cn";
import { navigation, type NavItem } from "@/config/navigation";
import { usePermission } from "@/hooks/use-permission";
import { useSidebarStore } from "@/store/sidebar.store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function filterNav(items: NavItem[], can: (p?: string | string[]) => boolean): NavItem[] {
  return items
    .map((item) => {
      const allowed = can(item.permission);
      const children = item.children ? filterNav(item.children, can) : undefined;
      if (children && children.length === 0 && !item.href) return null;
      if (!allowed && !children?.length) return null;
      return { ...item, children };
    })
    .filter(Boolean) as NavItem[];
}

export function Sidebar({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggleCollapsed);
  const { can } = usePermission();

  const items = useMemo(() => filterNav(navigation, can), [can]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card text-card-foreground">
      <div
        className={cn(
          "flex h-16 items-center border-b border-border px-4",
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
              className="hidden rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground lg:inline-flex"
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
            className="absolute -left-3 top-5 hidden rounded-full border border-border bg-card p-1 text-muted-foreground shadow hover:text-foreground lg:inline-flex"
            aria-label="باز کردن سایدبار"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {items.map((item) => (
          <NavItemRow
            key={item.label}
            item={item}
            pathname={pathname}
            collapsed={collapsed}
            onItemClick={onItemClick}
          />
        ))}
      </nav>

      <div className="border-t border-border p-3 text-xs text-muted-foreground">
        {collapsed ? null : <span>سفید و سیاه · پنل مدیریت</span>}
      </div>
    </div>
  );
}

function Logo({ only }: { only?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
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
  const active = item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false;
  const childActive = item.children?.some((c) =>
    c.href ? pathname === c.href || pathname.startsWith(c.href + "/") : false,
  );
  const [open, setOpen] = useState<boolean>(!!childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  if (!hasChildren && item.href) {
    const button = (
      <Link
        href={item.href}
        onClick={onItemClick}
        className={cn(
          "group flex h-9 items-center gap-2 rounded-md px-2.5 text-sm font-medium transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "text-foreground/80 hover:bg-accent hover:text-foreground",
          collapsed && "justify-center px-0",
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
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
    return (
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm font-medium transition-colors",
            childActive ? "text-foreground" : "text-foreground/80",
            "hover:bg-accent hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <>
              <span>{item.label}</span>
              <ChevronLeft
                className={cn(
                  "ms-auto h-4 w-4 transition-transform",
                  open && "-rotate-90",
                )}
              />
            </>
          )}
        </button>
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
                        "flex h-8 items-center gap-2 rounded-md px-2.5 text-xs transition-colors",
                        isActive
                          ? "bg-primary/10 font-medium text-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          isActive ? "bg-primary" : "bg-border",
                        )}
                      />
                      {child.label}
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
