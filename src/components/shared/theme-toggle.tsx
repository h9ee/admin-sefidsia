"use client";

import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/store/theme.store";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  const init = useThemeStore((s) => s.init);
  useEffect(() => init(), [init]);

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggle}
      className={className}
      aria-label={theme === "dark" ? "حالت روشن" : "حالت تاریک"}
      title={theme === "dark" ? "حالت روشن" : "حالت تاریک"}
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
