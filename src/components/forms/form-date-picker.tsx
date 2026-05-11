"use client";

import { useFormContext, type FieldValues, type Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormField } from "./form-field";

type Props<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  hint?: string;
  required?: boolean;
};

/**
 * Lightweight HTML5 date picker. Persian calendar support can be plugged later
 * by wrapping a Persian calendar library here without changing call sites.
 */
export function FormDatePicker<T extends FieldValues>({ name, label, hint, required }: Props<T>) {
  const { register, formState } = useFormContext<T>();
  const error = formState.errors[name]?.message as string | undefined;
  return (
    <FormField label={label} htmlFor={name} hint={hint} error={error} required={required}>
      <Input id={name} type="date" {...register(name)} />
    </FormField>
  );
}
