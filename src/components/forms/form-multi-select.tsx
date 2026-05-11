"use client";

import { useState } from "react";
import { Controller, type FieldValues, type Path, useFormContext } from "react-hook-form";
import { Check, ChevronDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "./form-field";
import { cn } from "@/lib/cn";

type Option = { label: string; value: string };

type Props<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  hint?: string;
  required?: boolean;
  options: Option[];
  placeholder?: string;
};

export function FormMultiSelect<T extends FieldValues>({
  name,
  label,
  hint,
  required,
  options,
  placeholder = "انتخاب کنید",
}: Props<T>) {
  const { control, formState } = useFormContext<T>();
  const [search, setSearch] = useState("");
  const error = formState.errors[name]?.message as string | undefined;

  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const value: string[] = Array.isArray(field.value) ? field.value : [];
          const filtered = options.filter((o) =>
            o.label.toLowerCase().includes(search.toLowerCase()),
          );
          const toggle = (v: string) => {
            field.onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
          };
          return (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex min-h-10 w-full flex-wrap items-center gap-1 rounded-lg border border-input bg-card px-2 py-1.5 text-right text-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    error && "border-destructive",
                  )}
                >
                  {value.length === 0 ? (
                    <span className="text-muted-foreground">{placeholder}</span>
                  ) : (
                    value.map((v) => {
                      const opt = options.find((o) => o.value === v);
                      return (
                        <Badge key={v} variant="secondary" className="gap-1">
                          <span>{opt?.label ?? v}</span>
                          <X
                            className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggle(v);
                            }}
                          />
                        </Badge>
                      );
                    })
                  )}
                  <ChevronDown className="ms-auto h-4 w-4 opacity-60" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                <Input
                  placeholder="جستجو…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 text-xs"
                />
                <div className="mt-2 max-h-64 overflow-auto">
                  {filtered.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                      موردی نیست
                    </p>
                  ) : (
                    filtered.map((o) => {
                      const selected = value.includes(o.value);
                      return (
                        <Button
                          key={o.value}
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => toggle(o.value)}
                        >
                          <span
                            className={cn(
                              "ms-1 h-4 w-4 rounded-sm border border-border",
                              selected && "bg-primary border-primary text-primary-foreground",
                              "flex items-center justify-center",
                            )}
                          >
                            {selected ? <Check className="h-3 w-3" /> : null}
                          </span>
                          <span>{o.label}</span>
                        </Button>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
          );
        }}
      />
    </FormField>
  );
}
