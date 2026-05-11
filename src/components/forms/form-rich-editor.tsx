"use client";

import { useEffect, useRef } from "react";
import { Controller, type FieldValues, type Path, useFormContext } from "react-hook-form";
import { Bold, Italic, List, ListOrdered, Quote, Heading2, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "./form-field";
import { cn } from "@/lib/cn";

type Props<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
};

export function FormRichEditor<T extends FieldValues>({
  name,
  label,
  hint,
  required,
  placeholder,
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
          />
        )}
      />
    </FormField>
  );
}

function RichEditor({
  value,
  onChange,
  placeholder = "متن خود را اینجا بنویسید…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && value !== ref.current.innerHTML) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  const exec = (cmd: string, val?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, val);
    onChange(ref.current?.innerHTML ?? "");
  };

  return (
    <div className="rounded-lg border border-input bg-card">
      <div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1.5">
        <Tool icon={Bold} title="ضخیم" onClick={() => exec("bold")} />
        <Tool icon={Italic} title="مورب" onClick={() => exec("italic")} />
        <Tool icon={Heading2} title="عنوان" onClick={() => exec("formatBlock", "<h2>")} />
        <Tool icon={Quote} title="نقل قول" onClick={() => exec("formatBlock", "<blockquote>")} />
        <Tool icon={List} title="فهرست" onClick={() => exec("insertUnorderedList")} />
        <Tool icon={ListOrdered} title="فهرست شماره‌دار" onClick={() => exec("insertOrderedList")} />
        <Tool icon={Code} title="کد" onClick={() => exec("formatBlock", "<pre>")} />
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className={cn(
          "min-h-[180px] p-3 text-sm leading-7 focus:outline-none",
          "[&_h2]:text-lg [&_h2]:font-semibold [&_blockquote]:border-r-4 [&_blockquote]:pr-3 [&_blockquote]:text-muted-foreground",
          "[&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:text-xs",
          "[&_ul]:list-disc [&_ul]:pr-6 [&_ol]:list-decimal [&_ol]:pr-6",
        )}
        data-placeholder={placeholder}
        onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
      />
    </div>
  );
}

function Tool({
  icon: Icon,
  title,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onClick: () => void;
}) {
  return (
    <Button type="button" size="icon-sm" variant="ghost" onClick={onClick} title={title}>
      <Icon className="h-4 w-4" />
    </Button>
  );
}
