import type { ComponentType, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  value: number | string;
  icon?: ComponentType<{ className?: string }>;
  delta?: ReactNode;
  className?: string;
};

export function StatCard({ label, value, icon: Icon, delta, className }: Props) {
  return (
    <Card className={cn("transition-shadow hover:shadow-md", className)}>
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {typeof value === "number" ? formatNumber(value) : value}
          </p>
          {delta ? <div className="text-xs text-muted-foreground">{delta}</div> : null}
        </div>
        {Icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground/80">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
