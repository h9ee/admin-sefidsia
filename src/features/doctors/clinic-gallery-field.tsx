"use client";

import * as React from "react";
import { Controller, type FieldValues, type Path, useFormContext } from "react-hook-form";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { MediaPicker } from "@/features/media";
import { mediaUrl } from "@/lib/media-url";

type Props<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  hint?: string;
  /** Hard upper bound — backend rejects more than this in the validator. */
  max?: number;
};

/**
 * Gallery field that opens the media library in multi-select mode and
 * stores the picked items as `string[]` of `/uploads/...` paths. Used by
 * each doctor clinic's gallery in the admin clinic editor.
 */
export function ClinicGalleryField<T extends FieldValues>({
  name,
  label = "گالری",
  hint,
  max = 24,
}: Props<T>) {
  const { control, formState } = useFormContext<T>();
  const error = formState.errors[name]?.message as string | undefined;
  const [open, setOpen] = React.useState(false);

  return (
    <FormField label={label} hint={hint} error={error}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const value: string[] = Array.isArray(field.value) ? field.value : [];
          const reachedMax = value.length >= max;

          return (
            <div className="space-y-3">
              {value.length > 0 ? (
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {value.map((src, i) => (
                    <li
                      key={`${src}-${i}`}
                      className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={mediaUrl(src)}
                        alt=""
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          field.onChange(value.filter((_, j) => j !== i))
                        }
                        className="absolute right-1 top-1 inline-flex size-7 items-center justify-center rounded-md bg-black/60 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/80"
                        aria-label="حذف"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  هنوز تصویری اضافه نشده است.
                </p>
              )}

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {value.length} / {max} تصویر
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={reachedMax}
                  onClick={() => setOpen(true)}
                >
                  <ImagePlus />
                  افزودن تصویر
                </Button>
              </div>

              <MediaPicker
                open={open}
                onOpenChange={setOpen}
                kind="image"
                multiple
                onSelect={(items) => {
                  const incoming = items.map((it) => it.url);
                  // Deduplicate while preserving order; cap at `max`.
                  const merged = [...value];
                  for (const url of incoming) {
                    if (merged.length >= max) break;
                    if (!merged.includes(url)) merged.push(url);
                  }
                  field.onChange(merged);
                }}
              />
            </div>
          );
        }}
      />
    </FormField>
  );
}
