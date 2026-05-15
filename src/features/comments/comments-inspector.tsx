"use client";

import { useState } from "react";
import { toast } from "sonner";
import { EyeOff, Search, ShieldCheck, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { commentsService } from "@/services/questions.service";
import { moderationService } from "@/services/reports.service";
import { parseApiError } from "@/lib/api-error";
import { formatRelativeTime } from "@/lib/format";
import { displayName, userInitials } from "@/lib/user";
import type { Comment, CommentTargetType } from "@/types";

const targetLabel: Record<string, string> = {
  article: "مقاله",
  question: "سوال",
  answer: "پاسخ",
};

/**
 * Backend's comments endpoint is per-target. This inspector reads comments by
 * (targetType, targetId) and lets the moderator act on each.
 */
export function CommentsInspector() {
  const [targetType, setTargetType] = useState<CommentTargetType>("article");
  const [targetId, setTargetId] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const list = await commentsService.listForTarget(targetType, targetId.trim());
      setComments(list);
    } catch (e) {
      toast.error(parseApiError(e).message);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>جستجوی نظرات</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              search();
            }}
          >
            <Select value={targetType} onValueChange={(v) => setTargetType(v as CommentTargetType)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="article">مقاله</SelectItem>
                <SelectItem value="question">سوال</SelectItem>
                <SelectItem value="answer">پاسخ</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-64">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="شناسه (UUID) موضوع را وارد کنید…"
                dir="ltr"
                className="pe-9"
              />
            </div>
            <Button type="submit" disabled={loading}>
              جستجو
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <EmptyState
            title="نظری یافت نشد"
            description="نوع و شناسه موضوع را وارد کنید تا نظرات آن نمایش داده شوند."
          />
        ) : (
          comments.map((c) => (
            <Card key={c.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      {c.author?.avatar ? (
                        <AvatarImage src={c.author.avatar} alt={displayName(c.author)} />
                      ) : null}
                      <AvatarFallback>{userInitials(c.author)}</AvatarFallback>
                    </Avatar>
                    <div className="text-xs">
                      <span className="font-medium">{displayName(c.author)}</span>
                      <span className="ms-1 text-muted-foreground">
                        · {formatRelativeTime(c.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">{targetLabel[c.targetType] ?? c.targetType}</Badge>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
                <p className="text-sm leading-7">{c.body}</p>
                <PermissionGuard permission="moderation.manage">
                  <div className="flex flex-wrap gap-1 border-t border-border pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await moderationService.act({
                            targetType: "comment",
                            targetId: c.id,
                            action: "hide",
                          });
                          await search();
                          toast.success("نظر پنهان شد");
                        } catch (e) {
                          toast.error(parseApiError(e).message);
                        }
                      }}
                    >
                      <EyeOff className="h-3 w-3" />
                      پنهان‌سازی
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await moderationService.act({
                            targetType: "comment",
                            targetId: c.id,
                            action: "restore",
                          });
                          await search();
                          toast.success("نظر بازگردانده شد");
                        } catch (e) {
                          toast.error(parseApiError(e).message);
                        }
                      }}
                    >
                      <ShieldCheck className="h-3 w-3" />
                      بازگردانی
                    </Button>
                    <PermissionGuard permission="comments.delete">
                      <ConfirmDialog
                        title="حذف نظر"
                        destructive
                        confirmLabel="حذف"
                        onConfirm={async () => {
                          try {
                            await commentsService.remove(c.id);
                            await search();
                            toast.success("نظر حذف شد");
                          } catch (e) {
                            toast.error(parseApiError(e).message);
                          }
                        }}
                        trigger={
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-3 w-3" />
                            حذف
                          </Button>
                        }
                      />
                    </PermissionGuard>
                  </div>
                </PermissionGuard>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
