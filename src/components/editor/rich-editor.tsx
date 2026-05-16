"use client";

import * as React from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { TextAlign } from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extension-placeholder";
import { CharacterCount } from "@tiptap/extension-character-count";
import { Highlight } from "@tiptap/extension-highlight";
import { Typography } from "@tiptap/extension-typography";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";

import { PersianNormalize } from "./extensions/persian-normalize";
import { Callout } from "./extensions/callout";
import { Toolbar } from "./toolbar";
import { cn } from "@/lib/cn";
import { toPersianDigits } from "@/lib/persian";

import "./editor.css";

const lowlight = createLowlight(common);

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  /** Optional handler — wired to the toolbar's image button so callers can hook
   *  a custom upload dialog (Media API). Falls back to URL prompt when absent. */
  onUploadImage?: () => void;
  /** Soft character cap; UI shows warning beyond it. */
  maxLength?: number;
}

export function RichEditor({
  value,
  onChange,
  placeholder = "متن مقاله را اینجا بنویسید…",
  className,
  onUploadImage,
  maxLength,
}: RichEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: false, // replaced by CodeBlockLowlight below
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Typography,
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https", "mailto", "tel"],
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { loading: "lazy", decoding: "async" },
      }),
      Table.configure({ resizable: true, HTMLAttributes: { dir: "rtl" } }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        defaultAlignment: "right",
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: undefined }),
      Callout,
      PersianNormalize,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        dir: "rtl",
        lang: "fa",
        spellcheck: "false",
        class: "ProseMirror prose-fa focus:outline-none",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes (e.g. when editing an existing article loaded async)
  React.useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  React.useEffect(() => () => editor?.destroy(), [editor]);

  return (
    <div
      className={cn(
        "rounded-lg border border-input bg-card overflow-hidden",
        className
      )}
    >
      <Toolbar editor={editor} onUploadImage={onUploadImage} />
      <EditorContent
        editor={editor}
        className="max-h-[70vh] min-h-[320px] overflow-y-auto bg-background px-5 py-6"
      />
      <EditorStatus editor={editor} maxLength={maxLength} />
    </div>
  );
}

function EditorStatus({
  editor,
  maxLength,
}: {
  editor: Editor | null;
  maxLength?: number;
}) {
  const [, force] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (!editor) return;
    const handler = () => force();
    editor.on("update", handler);
    editor.on("selectionUpdate", handler);
    return () => {
      editor.off("update", handler);
      editor.off("selectionUpdate", handler);
    };
  }, [editor]);

  if (!editor) return null;

  const chars = editor.storage.characterCount.characters() as number;
  const words = editor.storage.characterCount.words() as number;
  const readingMin = Math.max(1, Math.round(words / 220));
  const over = maxLength !== undefined && chars > maxLength;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground",
        over && "text-destructive"
      )}
    >
      <div className="flex items-center gap-4">
        <span>کلمات: {toPersianDigits(String(words))}</span>
        <span>
          نویسه: {toPersianDigits(String(chars))}
          {maxLength !== undefined && (
            <span className="opacity-70">
              {" / "}
              {toPersianDigits(String(maxLength))}
            </span>
          )}
        </span>
        <span>زمان مطالعه: {toPersianDigits(String(readingMin))} دقیقه</span>
      </div>
      <div className="hidden sm:block opacity-70">
        نکته: اعداد و حروف عربی به‌صورت خودکار به فارسی تبدیل می‌شوند.
      </div>
    </div>
  );
}
