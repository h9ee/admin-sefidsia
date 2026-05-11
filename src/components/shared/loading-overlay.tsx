import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function LoadingOverlay({ label = "در حال بارگذاری…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground", className)}>
      <Loader2 className="h-5 w-5 animate-spin" />
      <p className="text-xs">{label}</p>
    </div>
  );
}
