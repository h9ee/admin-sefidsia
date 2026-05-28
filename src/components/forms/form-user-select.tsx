"use client";

import * as React from "react";
import {
  Controller,
  type FieldValues,
  type Path,
  useFormContext,
} from "react-hook-form";
import { Check, ChevronsUpDown, Loader2, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "./form-field";
import { cn } from "@/lib/cn";
import { usersService } from "@/services/users.service";
import { displayName } from "@/lib/user";
import type { User, UserType } from "@/types";

type Props<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  /** Restrict suggestions to a specific user type (e.g. 'normal'). */
  userType?: UserType;
};

/**
 * Searchable user picker. Loads from `/users` with a debounced query.
 * Stores the user's numeric id in the form. Null clears the selection.
 */
export function FormUserSelect<T extends FieldValues>({
  name,
  label,
  hint,
  required,
  placeholder = "کاربر را انتخاب کنید…",
  userType,
}: Props<T>) {
  const { control, formState } = useFormContext<T>();
  const error = formState.errors[name]?.message as string | undefined;
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [list, setList] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<User | null>(null);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await usersService.list({
          q: q.trim() || undefined,
          userType,
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
  }, [open, q, userType]);

  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const value = field.value as number | string | null | undefined;

          // Lazy-resolve label for an already-selected id (e.g. editing).
          React.useEffect(() => {
            if (!value || selected) return;
            usersService
              .get(String(value))
              .then((u) => setSelected(u))
              .catch(() => {
                /* ignore */
              });
            // eslint-disable-next-line react-hooks/exhaustive-deps
          }, [value]);

          const pick = (u: User) => {
            setSelected(u);
            field.onChange(Number(u.id));
            setOpen(false);
          };
          const clear = () => {
            setSelected(null);
            field.onChange(null);
          };

          const display = selected ? userLabel(selected) : value ? `کاربر #${value}` : "";

          return (
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
                className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[320px]"
              >
                <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="جستجو نام، نام‌کاربری، موبایل یا ایمیل…"
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
                      کاربری یافت نشد.
                    </p>
                  ) : (
                    list.map((u) => {
                      const id = Number(u.id);
                      const isSelected = Number(value) === id;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => pick(u)}
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
                            <div className="truncate font-medium">{userLabel(u)}</div>
                            <div
                              className="truncate text-xs text-muted-foreground"
                              dir="ltr"
                            >
                              @{u.username}
                              {u.mobile ? ` · ${u.mobile}` : ""}
                              {u.email ? ` · ${u.email}` : ""}
                            </div>
                          </div>
                          {u.userType === "doctor" ? (
                            <span className="text-[10px] rounded-full border border-border px-1.5 py-0.5 text-muted-foreground">
                              پزشک
                            </span>
                          ) : null}
                        </button>
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

function userLabel(u: User): string {
  return displayName(u);
}
