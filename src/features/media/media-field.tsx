"use client";

import * as React from "react";
import { Controller, type FieldValues, type Path, useFormContext } from "react-hook-form";
import { FileAudio2, FileText, ImageIcon, Pencil, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { cn } from "@/lib/cn";
import { mediaUrl } from "@/lib/media-url";
import { MediaPicker, type MediaPickerKind } from "./media-picker";
import type { MediaItem } from "@/types";

type StoredValue = string | { id: number; url: string } | null;

type Props<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  hint?: string;
  required?: boolean;
  /** Restrict picker to a kind. Default: 'image'. */
  kind?: MediaPickerKind;
  /** What to store in the form. 'url' (default) keeps URL string;
   *  'id' stores numeric media id; 'object' stores {id, url}. */
  store?: "url" | "id" | "object";
  /** Optional preview height; defaults to `h-40`. */
  previewClassName?: string;
};

/**
 * Form-aware media picker field. Click to open the library dialog → either
 * select an existing item or upload a new one. Renders a thumbnail preview
 * for the selected item.
 *
 * Usage:
 *   <MediaField name="coverImage" label="تصویر شاخص" kind="image" />
 */
export function MediaField<T extends FieldValues>({
  name,
  label,
  hint,
  required,
  kind = "image",
  store = "url",
  previewClassName,
}: Props<T>) {
  const { control, formState } = useFormContext<T>();
  const error = formState.errors[name]?.message as string | undefined;
  const [open, setOpen] = React.useState(false);

  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const value = field.value as StoredValue;
          const display = toDisplay(value);
          const hasValue = Boolean(display.url);

          return (
            <>
              <div className="rounded-lg border border-dashed border-border bg-card p-3">
                {hasValue ? (
                  <div className="flex items-center gap-3">
                    <Preview
                      url={display.url}
                      kind={display.kind}
                      className={cn("h-20 w-20 shrink-0", previewClassName)}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sm font-medium"
                        title={display.url}
                        dir="ltr"
                      >
                        {display.url.split("/").pop() || display.url}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {KIND_LABEL[display.kind]}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setOpen(true)}
                      >
                        <Pencil className="h-4 w-4" />
                        تغییر
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => field.onChange(null)}
                        aria-label="حذف"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setOpen(true)}
                  >
                    <ImageIcon className="h-4 w-4" />
                    انتخاب از کتابخانه یا بارگذاری
                  </Button>
                )}
              </div>

              <MediaPicker
                open={open}
                onOpenChange={setOpen}
                kind={kind}
                onSelect={(items) => {
                  const first = items[0];
                  if (!first) return;
                  field.onChange(extractValue(first, store));
                }}
              />
            </>
          );
        }}
      />
    </FormField>
  );
}

/* ---------------------------------------------------------------- */

const KIND_LABEL: Record<"image" | "video" | "audio" | "file", string> = {
  image: "تصویر",
  video: "ویدئو",
  audio: "صدا",
  file: "فایل",
};

function extractValue(
  item: MediaItem,
  store: "url" | "id" | "object",
): StoredValue {
  if (store === "id") return { id: item.id, url: item.url };
  if (store === "object") return { id: item.id, url: item.url };
  return item.url;
}

function toDisplay(value: StoredValue): {
  url: string;
  kind: "image" | "video" | "audio" | "file";
} {
  if (!value) return { url: "", kind: "image" };
  const url = typeof value === "string" ? value : value.url;
  return { url, kind: guessKind(url) };
}

function guessKind(url: string): "image" | "video" | "audio" | "file" {
  const lower = url.toLowerCase();
  if (/\.(jpe?g|png|webp|avif|gif|svg)(\?|$)/i.test(lower)) return "image";
  if (/\.(mp4|webm|mov)(\?|$)/i.test(lower)) return "video";
  if (/\.(mp3|ogg|wav|m4a)(\?|$)/i.test(lower)) return "audio";
  return "file";
}

function Preview({
  url,
  kind,
  className,
}: {
  url: string;
  kind: "image" | "video" | "audio" | "file";
  className?: string;
}) {
  const src = mediaUrl(url);
  const base = "overflow-hidden rounded-md bg-muted";
  if (kind === "image") {
    return (
      <div className={cn(base, className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }
  if (kind === "video") {
    return (
      <div
        className={cn(
          base,
          "flex items-center justify-center bg-zinc-800 text-white",
          className,
        )}
      >
        <Video className="h-6 w-6" />
      </div>
    );
  }
  if (kind === "audio") {
    return (
      <div
        className={cn(
          base,
          "flex items-center justify-center bg-zinc-800 text-white",
          className,
        )}
      >
        <FileAudio2 className="h-6 w-6" />
      </div>
    );
  }
  return (
    <div className={cn(base, "flex items-center justify-center", className)}>
      <FileText className="h-6 w-6 text-muted-foreground" />
    </div>
  );
}
