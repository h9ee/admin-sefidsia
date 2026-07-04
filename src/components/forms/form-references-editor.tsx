"use client";

import * as React from "react";
import {
  Controller,
  type FieldValues,
  type Path,
  useFormContext,
} from "react-hook-form";
import { BookOpen, ChevronDown, Globe2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { FormField } from "./form-field";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";

type ReferenceItem = {
  title: string;
  sourceType?: "book" | "website";
  url?: string;
  authors?: string;
  year?: number;
  publisher?: string;
};

type Props<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  hint?: string;
  required?: boolean;
  max?: number;
};

/** Edits an array of scientific references with source type metadata. */
export function FormReferencesEditor<T extends FieldValues>({
  name,
  label,
  hint,
  required,
  max = 50,
}: Props<T>) {
  const { control, formState } = useFormContext<T>();
  const error = formState.errors[name]?.message as string | undefined;
  const [openIdx, setOpenIdx] = React.useState<number | null>(0);

  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const value = (field.value as ReferenceItem[] | undefined) ?? [];
          const update = (next: ReferenceItem[]) => field.onChange(next);

          const addRow = () => {
            if (value.length >= max) return;
            update([...value, { title: "", sourceType: "website" }]);
            setOpenIdx(value.length);
          };
          const removeRow = (i: number) =>
            update(value.filter((_, idx) => idx !== i));
          const editRow = (i: number, patch: Partial<ReferenceItem>) =>
            update(value.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

          return (
            <div className="space-y-2">
              {value.length === 0 && (
                <div className="rounded-lg border border-dashed border-border bg-card px-4 py-8 text-center">
                  <BookOpen className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">منبع علمی اضافه نشده</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    استناد به منابع معتبر، اعتماد خواننده و اعتبار سئو را افزایش می‌دهد.
                  </p>
                </div>
              )}
              <ul className="space-y-2">
                {value.map((item, i) => {
                  const isOpen = openIdx === i;
                  return (
                    <li
                      key={i}
                      className={cn(
                        "rounded-lg border bg-card transition-colors",
                        isOpen
                          ? "border-foreground/30 shadow-sm"
                          : "border-border",
                      )}
                    >
                      <div className="flex items-center gap-2 px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setOpenIdx(isOpen ? null : i)}
                          className="flex flex-1 items-center gap-2 text-start min-w-0"
                          aria-expanded={isOpen}
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                              isOpen && "rotate-180",
                            )}
                          />
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] tabular-nums">
                            {(i + 1).toLocaleString("fa-IR")}
                          </span>
                          <span className="truncate text-sm">
                            {item.title.trim() || (
                              <span className="text-muted-foreground">
                                منبع بدون عنوان
                              </span>
                            )}
                          </span>
                          <span className="hidden shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground sm:inline-flex">
                            {item.sourceType === "book" ? (
                              <BookOpen className="h-3 w-3" />
                            ) : (
                              <Globe2 className="h-3 w-3" />
                            )}
                            {item.sourceType === "book" ? "کتاب" : "سایت"}
                          </span>
                          {(item.year || item.publisher) && (
                            <span className="hidden sm:inline text-xs text-muted-foreground">
                              {item.publisher}
                              {item.year ? ` — ${item.year}` : ""}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRow(i)}
                          aria-label="حذف منبع"
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {isOpen && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-border px-3 py-3">
                          <div className="sm:col-span-2">
                            <Label className="text-xs">عنوان منبع *</Label>
                            <Input
                              value={item.title}
                              onChange={(e) =>
                                editRow(i, { title: e.target.value })
                              }
                              placeholder="عنوان مقاله یا کتاب"
                              className="mt-1"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                              <Checkbox
                                checked={item.sourceType === "book"}
                                onCheckedChange={(checked) =>
                                  editRow(i, {
                                    sourceType: checked ? "book" : "website",
                                  })
                                }
                                className="mt-0.5"
                              />
                              <span className="space-y-0.5">
                                <span className="block font-medium">
                                  این منبع کتاب است
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  اگر تیک نخورده باشد، منبع به‌عنوان سایت ذخیره می‌شود.
                                </span>
                              </span>
                            </label>
                          </div>
                          <div className="sm:col-span-2">
                            <Label className="text-xs">نویسندگان</Label>
                            <Input
                              value={item.authors ?? ""}
                              onChange={(e) =>
                                editRow(i, { authors: e.target.value })
                              }
                              placeholder="مثلاً: Smith J, Doe A"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">سال انتشار</Label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={1800}
                              max={2100}
                              value={item.year ?? ""}
                              onChange={(e) =>
                                editRow(i, {
                                  year: e.target.value
                                    ? Number(e.target.value)
                                    : undefined,
                                })
                              }
                              placeholder="2024"
                              className="mt-1"
                              dir="ltr"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">ناشر</Label>
                            <Input
                              value={item.publisher ?? ""}
                              onChange={(e) =>
                                editRow(i, { publisher: e.target.value })
                              }
                              placeholder="The Lancet"
                              className="mt-1"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <Label className="text-xs">URL منبع</Label>
                            <Input
                              value={item.url ?? ""}
                              onChange={(e) =>
                                editRow(i, { url: e.target.value })
                              }
                              onBlur={(e) =>
                                editRow(i, { url: e.target.value.trim() })
                              }
                              placeholder="https://www.example.com/article"
                              className="mt-1"
                              dir="ltr"
                              type="url"
                            />
                            <p className="mt-1 text-[10.5px] text-muted-foreground">
                              برای منابع سایت می‌توانید لینک صفحه را وارد کنید؛ اجباری نیست.
                            </p>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
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
                  افزودن منبع
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
