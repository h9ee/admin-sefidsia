"use client";

import * as React from "react";
import {
  Controller,
  type FieldValues,
  type Path,
  useFormContext,
} from "react-hook-form";
import { GripVertical, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "./form-field";
import { cn } from "@/lib/cn";

type Props<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  max?: number;
  /** Show row reorder handles (visual only — no DnD yet). */
  showHandles?: boolean;
};

/**
 * Edits an array of strings (e.g. key takeaways). Add/remove rows,
 * persists to RHF as `string[]`. Empty rows are dropped on submit by the
 * parent's transform — but we trim on blur to keep the data clean.
 */
export function FormStringList<T extends FieldValues>({
  name,
  label,
  hint,
  required,
  placeholder = "یک مورد بنویسید…",
  max = 10,
  showHandles = true,
}: Props<T>) {
  const { control, formState } = useFormContext<T>();
  const error = formState.errors[name]?.message as string | undefined;

  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const value = (field.value as string[] | undefined) ?? [];
          const update = (next: string[]) => field.onChange(next);

          const addRow = () => {
            if (value.length >= max) return;
            update([...value, ""]);
          };
          const removeRow = (i: number) =>
            update(value.filter((_, idx) => idx !== i));
          const editRow = (i: number, v: string) =>
            update(value.map((s, idx) => (idx === i ? v : s)));

          return (
            <div className="space-y-2">
              {value.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">
                  هنوز موردی اضافه نشده.
                </p>
              )}
              <ul className="space-y-1.5">
                {value.map((v, i) => (
                  <li
                    key={i}
                    className="group flex items-center gap-2 rounded-md border border-border bg-card pe-2 ps-1.5 py-1"
                  >
                    {showHandles && (
                      <span
                        aria-hidden
                        className="cursor-grab text-muted-foreground/60"
                      >
                        <GripVertical className="h-4 w-4" />
                      </span>
                    )}
                    <span className="shrink-0 w-6 text-center text-xs text-muted-foreground tabular-nums">
                      {(i + 1).toLocaleString("fa-IR")}
                    </span>
                    <Input
                      value={v}
                      onChange={(e) => editRow(i, e.target.value)}
                      onBlur={(e) => editRow(i, e.target.value.trim())}
                      placeholder={placeholder}
                      className="h-9 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
                    />
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      aria-label="حذف"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addRow}
                  disabled={value.length >= max}
                >
                  <Plus className="h-4 w-4" />
                  افزودن مورد
                </Button>
                <span
                  className={cn(
                    "text-[11px] text-muted-foreground tabular-nums",
                    value.length >= max && "text-destructive",
                  )}
                >
                  {value.length.toLocaleString("fa-IR")} /{" "}
                  {max.toLocaleString("fa-IR")}
                </span>
              </div>
            </div>
          );
        }}
      />
    </FormField>
  );
}
