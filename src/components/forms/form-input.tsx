"use client";

import { type InputHTMLAttributes } from "react";
import { useFormContext, type FieldValues, type Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormField } from "./form-field";

type Props<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  hint?: string;
  required?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "name">;

export function FormInput<T extends FieldValues>({
  name,
  label,
  hint,
  required,
  ...rest
}: Props<T>) {
  const { register, formState } = useFormContext<T>();
  const error = formState.errors[name]?.message as string | undefined;
  return (
    <FormField label={label} htmlFor={name} hint={hint} error={error} required={required}>
      <Input id={name} aria-invalid={!!error} {...rest} {...register(name)} />
    </FormField>
  );
}
