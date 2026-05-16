"use client";

import { Controller, type FieldValues, type Path, useFormContext } from "react-hook-form";
import { RichEditor } from "@/components/editor/rich-editor";
import { FormField } from "./form-field";

type Props<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  /** Optional soft character cap for the status bar. */
  maxLength?: number;
  /** Hook a custom image upload dialog (e.g. Media API picker). */
  onUploadImage?: () => void;
};

export function FormRichEditor<T extends FieldValues>({
  name,
  label,
  hint,
  required,
  placeholder,
  maxLength,
  onUploadImage,
}: Props<T>) {
  const { control, formState } = useFormContext<T>();
  const error = formState.errors[name]?.message as string | undefined;

  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <RichEditor
            value={(field.value as string) ?? ""}
            onChange={field.onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            onUploadImage={onUploadImage}
          />
        )}
      />
    </FormField>
  );
}
