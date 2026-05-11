"use client";

import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useThemeStore } from "@/store/theme.store";
import { PermissionProvider } from "@/components/permission/permission-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  const init = useThemeStore((s) => s.init);
  useEffect(() => init(), [init]);

  return (
    <TooltipProvider delayDuration={150}>
      <PermissionProvider>
        {children}
        <Toaster position="top-center" richColors theme="system" toastOptions={{ duration: 3500 }} dir="rtl" />
      </PermissionProvider>
    </TooltipProvider>
  );
}
