"use client";

import { Controller, type FieldValues, type Path, useFormContext } from "react-hook-form";
import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "./form-field";

type Props<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  hint?: string;
  accept?: string;
  required?: boolean;
};

export function FormFileUpload<T extends FieldValues>({
  name,
  label,
  hint,
  accept = "image/*",
  required,
}: Props<T>) {
  const { control, formState } = useFormContext<T>();
  const error = formState.errors[name]?.message as string | undefined;
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const file = field.value as File | string | null | undefined;
          const isString = typeof file === "string" && file.length > 0;
          const display = previewUrl || (isString ? file : null);
          return (
            <div className="rounded-lg border border-dashed border-border bg-card p-4">
              <input
                ref={inputRef}
                type="file"
                accept={accept}
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  field.onChange(f);
                  if (f) setPreviewUrl(URL.createObjectURL(f));
                  else setPreviewUrl(null);
                }}
              />
              {display ? (
                <div className="flex items-center justify-between gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={display}
                    alt="preview"
                    className="h-16 w-16 rounded-md object-cover"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      field.onChange(null);
                      setPreviewUrl(null);
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                  >
                    <X className="h-4 w-4" />
                    حذف
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => inputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  انتخاب فایل
                </Button>
              )}
            </div>
          );
        }}
      />
    </FormField>
  );
}
