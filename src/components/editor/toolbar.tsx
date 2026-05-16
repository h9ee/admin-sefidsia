"use client";

import * as React from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  Code2,
  Link as LinkIcon,
  Link2Off,
  Image as ImageIcon,
  Table as TableIcon,
  TableProperties,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
  Undo2,
  Redo2,
  Eraser,
  Info,
  AlertTriangle,
  Sparkles,
  Lightbulb,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface ToolbarProps {
  editor: Editor | null;
  onUploadImage?: () => void;
  className?: string;
}

export function Toolbar({ editor, onUploadImage, className }: ToolbarProps) {
  if (!editor) return null;

  function promptLink() {
    const previous = editor!.getAttributes("link").href as string | undefined;
    const url = window.prompt("نشانی پیوند:", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function promptImageByUrl() {
    const url = window.prompt("نشانی تصویر:", "https://");
    if (!url) return;
    const alt = window.prompt("متن جایگزین (alt):", "") ?? "";
    editor!.chain().focus().setImage({ src: url, alt }).run();
  }

  function insertTable() {
    editor!
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5 sticky top-0 z-10",
        className
      )}
    >
      <Group>
        <Btn
          aria-label="بازگردانی (Ctrl+Z)"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </Btn>
        <Btn
          aria-label="انجام مجدد (Ctrl+Y)"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </Btn>
      </Group>

      <Divider />

      <Group>
        <Btn
          aria-label="عنوان ۲"
          pressed={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="h-4 w-4" />
        </Btn>
        <Btn
          aria-label="عنوان ۳"
          pressed={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="h-4 w-4" />
        </Btn>
        <Btn
          aria-label="عنوان ۴"
          pressed={editor.isActive("heading", { level: 4 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 4 }).run()
          }
        >
          <Heading4 className="h-4 w-4" />
        </Btn>
      </Group>

      <Divider />

      <Group>
        <Btn
          aria-label="ضخیم (Ctrl+B)"
          pressed={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Btn>
        <Btn
          aria-label="مورب (Ctrl+I)"
          pressed={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Btn>
        <Btn
          aria-label="زیرخط (Ctrl+U)"
          pressed={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Btn>
        <Btn
          aria-label="خط‌خورده"
          pressed={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </Btn>
        <Btn
          aria-label="هایلایت"
          pressed={editor.isActive("highlight")}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          <Highlighter className="h-4 w-4" />
        </Btn>
      </Group>

      <Divider />

      <Group>
        <Btn
          aria-label="فهرست"
          pressed={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Btn>
        <Btn
          aria-label="فهرست شماره‌دار"
          pressed={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Btn>
        <Btn
          aria-label="چک‌لیست"
          pressed={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <ListChecks className="h-4 w-4" />
        </Btn>
        <Btn
          aria-label="نقل قول"
          pressed={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Btn>
        <Btn
          aria-label="کد درون‌خطی"
          pressed={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="h-4 w-4" />
        </Btn>
        <Btn
          aria-label="بلوک کد"
          pressed={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 className="h-4 w-4" />
        </Btn>
        <Btn
          aria-label="خط جداکننده"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </Btn>
      </Group>

      <Divider />

      <Group>
        <Btn aria-label="پیوند" pressed={editor.isActive("link")} onClick={promptLink}>
          <LinkIcon className="h-4 w-4" />
        </Btn>
        {editor.isActive("link") && (
          <Btn
            aria-label="حذف پیوند"
            onClick={() => editor.chain().focus().unsetLink().run()}
          >
            <Link2Off className="h-4 w-4" />
          </Btn>
        )}
        <Btn
          aria-label="درج تصویر"
          onClick={onUploadImage ?? promptImageByUrl}
        >
          <ImageIcon className="h-4 w-4" />
        </Btn>
        <Btn aria-label="درج جدول" onClick={insertTable}>
          <TableIcon className="h-4 w-4" />
        </Btn>
        {editor.isActive("table") && (
          <details className="relative">
            <summary
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded hover:bg-accent list-none"
              aria-label="گزینه‌های جدول"
            >
              <TableProperties className="h-4 w-4" />
            </summary>
            <div className="absolute end-0 z-30 mt-1 grid gap-0.5 rounded-md border border-border bg-popover p-1 text-sm shadow-md w-56">
              <Mini onClick={() => editor.chain().focus().addRowBefore().run()}>افزودن سطر بالا</Mini>
              <Mini onClick={() => editor.chain().focus().addRowAfter().run()}>افزودن سطر پایین</Mini>
              <Mini onClick={() => editor.chain().focus().addColumnBefore().run()}>افزودن ستون قبل</Mini>
              <Mini onClick={() => editor.chain().focus().addColumnAfter().run()}>افزودن ستون بعد</Mini>
              <Mini onClick={() => editor.chain().focus().deleteRow().run()}>حذف سطر</Mini>
              <Mini onClick={() => editor.chain().focus().deleteColumn().run()}>حذف ستون</Mini>
              <Mini onClick={() => editor.chain().focus().toggleHeaderRow().run()}>سطر سرتیتر</Mini>
              <Mini onClick={() => editor.chain().focus().mergeOrSplit().run()}>ادغام / تقسیم سلول</Mini>
              <Mini onClick={() => editor.chain().focus().deleteTable().run()}>حذف جدول</Mini>
            </div>
          </details>
        )}
      </Group>

      <Divider />

      <Group>
        <Btn
          aria-label="چپ‌چین"
          pressed={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-4 w-4" />
        </Btn>
        <Btn
          aria-label="وسط‌چین"
          pressed={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-4 w-4" />
        </Btn>
        <Btn
          aria-label="راست‌چین"
          pressed={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="h-4 w-4" />
        </Btn>
        <Btn
          aria-label="جاستیفای"
          pressed={editor.isActive({ textAlign: "justify" })}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        >
          <AlignJustify className="h-4 w-4" />
        </Btn>
      </Group>

      <Divider />

      <Group>
        <Btn
          aria-label="بلوک نکته"
          onClick={() => editor.chain().focus().toggleCallout("note").run()}
          pressed={editor.isActive("callout", { type: "note" })}
        >
          <Lightbulb className="h-4 w-4" />
        </Btn>
        <Btn
          aria-label="بلوک اطلاع‌رسانی"
          onClick={() => editor.chain().focus().toggleCallout("info").run()}
          pressed={editor.isActive("callout", { type: "info" })}
        >
          <Info className="h-4 w-4" />
        </Btn>
        <Btn
          aria-label="بلوک هشدار پزشکی"
          onClick={() => editor.chain().focus().toggleCallout("warning").run()}
          pressed={editor.isActive("callout", { type: "warning" })}
        >
          <AlertTriangle className="h-4 w-4" />
        </Btn>
        <Btn
          aria-label="بلوک خطر"
          onClick={() => editor.chain().focus().toggleCallout("danger").run()}
          pressed={editor.isActive("callout", { type: "danger" })}
        >
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </Btn>
        <Btn
          aria-label="بلوک نکته مثبت"
          onClick={() => editor.chain().focus().toggleCallout("tip").run()}
          pressed={editor.isActive("callout", { type: "tip" })}
        >
          <Sparkles className="h-4 w-4" />
        </Btn>
      </Group>

      <Divider />

      <Group>
        <Btn
          aria-label="پاک کردن قالب"
          onClick={() =>
            editor.chain().focus().clearNodes().unsetAllMarks().run()
          }
        >
          <Eraser className="h-4 w-4" />
        </Btn>
      </Group>
    </div>
  );
}

function Btn({
  children,
  pressed,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      {...props}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded px-1.5 text-sm",
        "transition-colors hover:bg-accent",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:opacity-40 disabled:pointer-events-none",
        pressed && "bg-accent text-accent-foreground"
      )}
    >
      {children}
    </button>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-border" aria-hidden />;
}

function Mini({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded px-2 py-1.5 text-start hover:bg-accent"
    >
      {children}
    </button>
  );
}
