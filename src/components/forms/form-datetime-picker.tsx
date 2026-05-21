"use client";

import {
  Controller,
  type FieldValues,
  type Path,
  useFormContext,
} from "react-hook-form";
import DatePicker, { DateObject } from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "./form-field";
import "./datetime-picker.css";

type Props<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  hint?: string;
  required?: boolean;
  /** Minimum allowed datetime as ISO string. */
  min?: string;
  /** Hide the time portion (date-only). Default: false. */
  dateOnly?: boolean;
};

const INPUT_CLASS =
  "flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm " +
  "placeholder:text-muted-foreground transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 " +
  "focus-visible:ring-offset-1 focus-visible:ring-offset-background";

function toDateObject(iso: string): DateObject | undefined {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return new DateObject({ date: d, calendar: persian, locale: persian_fa });
}

/**
 * Persian (Jalali) date-time picker. The user sees a Persian calendar with
 * Persian digits/labels, but the value stored in form state stays an ISO 8601
 * (Gregorian) string for backend compatibility. Empty → null.
 */
export function FormDateTimePicker<T extends FieldValues>({
  name,
  label,
  hint,
  required,
  min,
  dateOnly = false,
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
          const raw = (field.value as string | null | undefined) ?? "";
          const value = raw ? toDateObject(raw) : undefined;

          return (
            <div className="flex items-center gap-2">
              <DatePicker
                inputClass={INPUT_CLASS}
                containerClassName="w-full"
                value={value}
                onChange={(d) => {
                  const obj = d as DateObject | null;
                  field.onChange(obj ? obj.toDate().toISOString() : null);
                }}
                calendar={persian}
                locale={persian_fa}
                format={dateOnly ? "YYYY/MM/DD" : "YYYY/MM/DD — HH:mm"}
                plugins={
                  dateOnly
                    ? []
                    : [<TimePicker key="time" position="bottom" hideSeconds />]
                }
                minDate={min ? toDateObject(min) : undefined}
                calendarPosition="bottom-right"
                portal
                editable={false}
                placeholder={dateOnly ? "انتخاب تاریخ" : "انتخاب تاریخ و زمان"}
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
