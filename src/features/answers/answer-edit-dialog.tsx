"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { answersService } from "@/services/questions.service";
import { parseApiError } from "@/lib/api-error";
import type { Answer } from "@/types";

/**
 * Inline edit dialog for an answer's body. The backend service enforces
 * "author or admin" — admins can use this to fix typos / strip personal
 * info without needing to delete and re-create.
 *
 * Editor surface kept intentionally plain (Textarea) — the body is HTML
 * and a full WYSIWYG would carry too much surface area for a moderation
 * tool. If we add a rich editor later, swap the Textarea here.
 */
export function AnswerEditDialog({
  answer,
  onClose,
  onSaved,
}: {
  answer: Answer | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  // Seed the textarea every time a different answer opens the dialog.
  useEffect(() => {
    setBody(answer?.body ?? "");
  }, [answer]);

  if (!answer) return null;

  const trimmed = body.trim();
  const valid = trimmed.length >= 10;

  return (
    <Dialog
      open={Boolean(answer)}
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>ویرایش پاسخ</DialogTitle>
          <DialogDescription>
            HTML ساده پشتیبانی می‌شود. بعد از ذخیره، تغییرات بلافاصله در سایت
            عمومی هم اعمال می‌شود.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          disabled={saving}
          dir="auto"
          className="font-mono text-sm leading-7"
        />
        {!valid && (
          <p className="text-xs text-destructive">
            متن پاسخ باید حداقل ۱۰ کاراکتر باشد.
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            type="button"
          >
            انصراف
          </Button>
          <Button
            disabled={!valid || saving}
            onClick={async () => {
              setSaving(true);
              try {
                await answersService.update(answer.id, { body: trimmed });
                toast.success("پاسخ به‌روز شد");
                onSaved();
              } catch (e) {
                toast.error(parseApiError(e).message);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            ذخیره
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
