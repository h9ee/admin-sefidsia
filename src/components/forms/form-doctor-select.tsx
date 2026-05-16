"use client";

import * as React from "react";
import {
  Controller,
  type FieldValues,
  type Path,
  useFormContext,
} from "react-hook-form";
import { BadgeCheck, Check, ChevronsUpDown, Loader2, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "./form-field";
import { cn } from "@/lib/cn";
import { doctorsService } from "@/services/doctors.service";
import type { Doctor } from "@/types";

type Props<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  /** What to store in the form. Default: 'userId' (number). */
  store?: "userId" | "id";
};

/**
 * Searchable doctor picker. Loads from `/doctors` with debounced query.
 * Stores the doctor's `userId` (or `id`) in the form. Null clears selection.
 */
export function FormDoctorSelect<T extends FieldValues>({
  name,
  label,
  hint,
  required,
  placeholder = "بازبین را انتخاب کنید…",
  store = "userId",
}: Props<T>) {
  const { control, formState } = useFormContext<T>();
  const error = formState.errors[name]?.message as string | undefined;
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [list, setList] = React.useState<Doctor[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedDoctor, setSelectedDoctor] = React.useState<Doctor | null>(null);

  // Debounced search on open
  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await doctorsService.list({
          q: q.trim() || undefined,
          verificationStatus: "approved",
          limit: 20,
        });
        if (!cancelled) setList(res.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, q]);

  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const value = field.value as number | null | undefined;

          // Lazy-resolve label for an already-selected id (e.g. editing existing article)
          React.useEffect(() => {
            if (!value || selectedDoctor) return;
            const id =
              typeof value === "number" ? String(value) : (value as string);
            doctorsService
              .get(id)
              .then((d) => setSelectedDoctor(d))
              .catch(() => {
                /* ignore */
              });
            // eslint-disable-next-line react-hooks/exhaustive-deps
          }, [value]);

          const pick = (doctor: Doctor) => {
            setSelectedDoctor(doctor);
            field.onChange(
              store === "id" ? Number(doctor.id) : Number(doctor.userId),
            );
            setOpen(false);
          };
          const clear = () => {
            setSelectedDoctor(null);
            field.onChange(null);
          };

          const display = selectedDoctor
            ? labelFor(selectedDoctor)
            : value
              ? `پزشک #${value}`
              : "";

          return (
            <>
              <Popover open={open} onOpenChange={setOpen}>
                <div className="flex items-center gap-2">
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "flex-1 justify-between text-start font-normal",
                        !display && "text-muted-foreground",
                      )}
                    >
                      <span className="truncate">{display || placeholder}</span>
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  {value ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={clear}
                      aria-label="حذف انتخاب"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
                <PopoverContent
                  align="start"
                  className="p-0 w-[--radix-popover-trigger-width] min-w-[320px]"
                >
                  <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="جستجو نام، تخصص یا شهر…"
                      className="h-8 border-0 px-1 focus-visible:ring-0 focus-visible:ring-offset-0"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-72 overflow-y-auto p-1">
                    {loading ? (
                      <div className="flex items-center justify-center py-8 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : list.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-6">
                        پزشکی یافت نشد.
                      </p>
                    ) : (
                      list.map((d) => {
                        const id =
                          store === "id" ? Number(d.id) : Number(d.userId);
                        const isSelected = value === id;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => pick(d)}
                            className={cn(
                              "flex w-full items-start gap-2 rounded-md px-2 py-2 text-start text-sm hover:bg-accent",
                              isSelected && "bg-accent",
                            )}
                          >
                            <Check
                              className={cn(
                                "mt-0.5 h-4 w-4 shrink-0",
                                isSelected ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1 truncate font-medium">
                                {labelFor(d)}
                                {d.verificationStatus === "approved" && (
                                  <BadgeCheck className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                                )}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">
                                {d.specialty}
                                {d.city ? ` • ${d.city}` : ""}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </>
          );
        }}
      />
    </FormField>
  );
}

function labelFor(d: Doctor): string {
  const u = d.user;
  if (u?.firstName || u?.lastName) {
    return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
  }
  return u?.username ?? `پزشک #${d.id}`;
}
