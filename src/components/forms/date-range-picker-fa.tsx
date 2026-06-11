"use client";

import * as React from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import "./datetime-picker.css";

/**
 * Standalone (non-RHF) Persian (Jalali) date-range picker — two pickers wired
 * together, value exchanged as ISO 8601 (Gregorian) strings so they're
 * back-end ready. Used by the admin questions list as the "بازهٔ زمانی" facet.
 *
 *  - Both bounds are optional; one-sided ranges are fine.
 *  - `from` is clamped to start-of-day, `to` to end-of-day so a single-day
 *    range catches every row created that day.
 *  - "پاک کردن" clears both at once.
 */
type Value = { from: string | null; to: string | null };

const INPUT_CLASS =
  "flex h-9 w-full rounded-lg border border-input bg-card px-3 py-1.5 text-sm " +
  "placeholder:text-muted-foreground transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 " +
  "focus-visible:ring-offset-1 focus-visible:ring-offset-background";

function toDateObject(iso: string | null): DateObject | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return new DateObject({ date: d, calendar: persian, locale: persian_fa });
}

export function DateRangePickerFa({
  value,
  onChange,
}: {
  value: Value;
  onChange: (next: Value) => void;
}) {
  const fromObj = toDateObject(value.from);
  const toObj = toDateObject(value.to);

  const handleFrom = (d: DateObject | DateObject[] | null) => {
    const obj = (Array.isArray(d) ? d[0] : d) ?? null;
    if (!obj) {
      onChange({ ...value, from: null });
      return;
    }
    const date = obj.toDate();
    // Start-of-day so a single-day range catches everything that day.
    date.setHours(0, 0, 0, 0);
    onChange({ ...value, from: date.toISOString() });
  };

  const handleTo = (d: DateObject | DateObject[] | null) => {
    const obj = (Array.isArray(d) ? d[0] : d) ?? null;
    if (!obj) {
      onChange({ ...value, to: null });
      return;
    }
    const date = obj.toDate();
    // End-of-day, inclusive.
    date.setHours(23, 59, 59, 999);
    onChange({ ...value, to: date.toISOString() });
  };

  const hasAny = Boolean(value.from || value.to);

  return (
    <div className="flex items-center gap-1.5">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <DatePicker
        inputClass={INPUT_CLASS}
        containerClassName="w-32"
        value={fromObj}
        onChange={handleFrom}
        calendar={persian}
        locale={persian_fa}
        format="YYYY/MM/DD"
        calendarPosition="bottom-right"
        portal
        editable={false}
        placeholder="از تاریخ"
      />
      <span className="text-xs text-muted-foreground">تا</span>
      <DatePicker
        inputClass={INPUT_CLASS}
        containerClassName="w-32"
        value={toObj}
        onChange={handleTo}
        calendar={persian}
        locale={persian_fa}
        format="YYYY/MM/DD"
        calendarPosition="bottom-right"
        portal
        editable={false}
        placeholder="تا تاریخ"
        minDate={fromObj}
      />
      {hasAny ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange({ from: null, to: null })}
          aria-label="پاک کردن بازهٔ زمانی"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      ) : null}
    </div>
  );
}
