"use client";

import { Controller, type FieldValues, type Path, useFormContext } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";

type Props<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  description?: string;
  className?: string;
};

export function FormSwitch<T extends FieldValues>({
  name,
  label,
  description,
  className,
}: Props<T>) {
  const { control } = useFormContext<T>();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div
          className={cn(
            "flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4",
            className,
          )}
        >
          <div className="space-y-0.5">
            {label ? <Label>{label}</Label> : null}
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <Switch checked={!!field.value} onCheckedChange={field.onChange} />
        </div>
      )}
    />
  );
}
