"use client";

import * as React from "react";
import {
  Controller,
  type FieldValues,
  type Path,
  useFormContext,
} from "react-hook-form";
import { ChevronDown, MessageCircleQuestion, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "./form-field";
import { cn } from "@/lib/cn";

type FaqItem = { question: string; answer: string };

type Props<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  hint?: string;
  required?: boolean;
  max?: number;
};

/** Edits an array of {question, answer} items — exposed as FAQ rich snippet. */
export function FormFaqEditor<T extends FieldValues>({
  name,
  label,
  hint,
  required,
  max = 20,
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
          const value = (field.value as FaqItem[] | undefined) ?? [];
          const update = (next: FaqItem[]) => field.onChange(next);

          const addRow = () => {
            if (value.length >= max) return;
            update([...value, { question: "", answer: "" }]);
            setOpenIdx(value.length);
          };
          const removeRow = (i: number) =>
            update(value.filter((_, idx) => idx !== i));
          const editRow = (i: number, patch: Partial<FaqItem>) =>
            update(value.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

          return (
            <div className="space-y-2">
              {value.length === 0 && (
                <div className="rounded-lg border border-dashed border-border bg-card px-4 py-8 text-center">
                  <MessageCircleQuestion className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">پرسش متداولی اضافه نشده</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    پرسش‌های متداول به نمایش rich snippet در گوگل کمک می‌کند.
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
                            {item.question.trim() || (
                              <span className="text-muted-foreground">
                                پرسش بدون عنوان
                              </span>
                            )}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRow(i)}
                          aria-label="حذف پرسش"
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {isOpen && (
                        <div className="space-y-2 border-t border-border px-3 py-3">
                          <Input
                            value={item.question}
                            onChange={(e) =>
                              editRow(i, { question: e.target.value })
                            }
                            placeholder="پرسش (مثلاً: علائم اولیه چیست؟)"
                          />
                          <Textarea
                            value={item.answer}
                            onChange={(e) =>
                              editRow(i, { answer: e.target.value })
                            }
                            placeholder="پاسخ کامل و مبتنی بر شواهد علمی…"
                            rows={4}
                          />
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
                  افزودن پرسش
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
