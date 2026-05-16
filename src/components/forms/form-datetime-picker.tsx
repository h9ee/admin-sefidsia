"use client";

import {
  Controller,
  type FieldValues,
  type Path,
  useFormContext,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { FormField } from "./form-field";

type Props<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  hint?: string;
  required?: boolean;
  /** Minimum allowed datetime as ISO string. Default: now. */
  min?: string;
};

/**
 * datetime-local picker storing ISO 8601 string in form state.
 * Empty string is normalized to `null` for backend compatibility.
 */
export function FormDateTimePicker<T extends FieldValues>({
  name,
  label,
  hint,
  required,
  min,
}: Props<T>) {
  const { control, formState } = useFormContext<T>();
  const error = formState.errors[name]?.message as string | undefined;

  return (
    <FormField
      label={label}
      htmlFor={name}
      hint={hint}
      error={error}
      required={required}
    >
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          // Backend stores ISO 8601; <input type="datetime-local"> needs "YYYY-MM-DDTHH:mm"
          const raw = (field.value as string | null | undefined) ?? "";
          const localValue = raw ? toLocalInput(raw) : "";
          return (
            <div className="flex items-center gap-2">
              <Input
                id={name}
                type="datetime-local"
                value={localValue}
                min={min ? toLocalInput(min) : undefined}
                onChange={(e) => {
                  const v = e.target.value;
                  field.onChange(v ? new Date(v).toISOString() : null);
                }}
                dir="ltr"
              />
              {raw && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => field.onChange(null)}
                  aria-label="پاک کردن"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        }}
      />
    </FormField>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}
