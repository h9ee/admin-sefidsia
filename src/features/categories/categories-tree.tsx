"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronLeft,
  Edit,
  EyeOff,
  FolderTree,
  ImageIcon,
  MoreHorizontal,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { usePermission } from "@/hooks/use-permission";
import { categoriesService } from "@/services/categories.service";
import { parseApiError } from "@/lib/api-error";
import { formatNumber, toPersianDigits } from "@/lib/format";
import { mediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/cn";
import { MAX_CATEGORY_DEPTH, type CategoryNode } from "@/types";

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "default" | "muted" | "outline" }
> = {
  active: { label: "فعال", variant: "default" },
  hidden: { label: "مخفی", variant: "muted" },
  archived: { label: "بایگانی", variant: "outline" },
};

/**
 * Tree view of all categories. Create/edit happens on dedicated routes
 * (`/categories/new` and `/categories/[id]/edit`) — this component only
 * renders the read-only outline plus a dropdown of actions per row.
 *
 * Why dedicated pages and not a modal: the long description field uses the
 * rich editor, which doesn't fit comfortably in a constrained dialog (image
 * upload picker, fullscreen toggle, find-and-replace, etc.).
 */
export function CategoriesTree() {
  const { can } = usePermission();
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);

  // `reload` is called from event handlers (after a successful delete) where
  // calling setState synchronously is fine. The initial fetch runs inline
  // below so its setStates happen in async callbacks rather than the effect
  // body — keeps React 19's "no cascading setState in effects" rule happy.
  const reload = async () => {
    setLoading(true);
    try {
      const t = await categoriesService.listTree();
      setTree(t);
    } catch (e) {
      toast.error(parseApiError(e).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void categoriesService
      .listTree()
      .then((t) => {
        if (!cancelled) setTree(t);
      })
      .catch((e) => {
        if (!cancelled) toast.error(parseApiError(e).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            ساختار دسته‌بندی
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            حداکثر تا {toPersianDigits(MAX_CATEGORY_DEPTH)} لایه تو در تو
          </p>
        </div>
        <PermissionGuard permission="categories.manage">
          <Button asChild size="sm">
            <Link href="/categories/new">
              <Plus />
              دسته ریشه
            </Link>
          </Button>
        </PermissionGuard>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-xs text-muted-foreground">در حال بارگذاری…</p>
        ) : tree.length === 0 ? (
          <EmptyState
            className="border-0"
            title="هیچ دسته‌ای ثبت نشده"
            description="برای شروع، یک دسته ریشه ایجاد کنید."
          />
        ) : (
          <div className="space-y-1">
            {tree.map((n) => (
              <Branch
                key={n.id}
                node={n}
                canManage={can("categories.manage")}
                onRemoved={() => void reload()}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Branch({
  node,
  canManage,
  onRemoved,
}: {
  node: CategoryNode;
  canManage: boolean;
  onRemoved: () => void;
}) {
  const [expanded, setExpanded] = useState(node.depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const atMaxDepth = node.depth >= MAX_CATEGORY_DEPTH;
  const statusInfo = STATUS_BADGE[node.status] ?? STATUS_BADGE.active;

  return (
    <div className={cn(node.depth > 1 && "ms-5 border-r border-border ps-3")}>
      <div className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/40">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded text-muted-foreground",
            !hasChildren && "invisible",
          )}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Thumbnail / color dot */}
        {node.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(node.coverImage)}
            alt=""
            className="h-7 w-7 shrink-0 rounded-md object-cover ring-1 ring-border"
          />
        ) : node.color ? (
          <span
            className="h-3 w-3 shrink-0 rounded-full ring-1 ring-border"
            style={{ backgroundColor: node.color }}
            aria-hidden
          />
        ) : (
          <ImageIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
        )}

        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Link
            href={`/categories/${node.id}/edit`}
            className="text-sm font-medium hover:underline"
          >
            {node.name}
          </Link>
          <code className="text-[10px] text-muted-foreground" dir="ltr">
            {node.slug}
          </code>
          <Badge variant="outline" className="text-[10px]">
            لایه {toPersianDigits(node.depth)}
          </Badge>
          <Badge variant={statusInfo.variant} className="text-[10px]">
            {statusInfo.label}
          </Badge>
          {node.isFeatured ? (
            <Badge variant="muted" className="gap-1 text-[10px]">
              <Star className="h-2.5 w-2.5" />
              ویژه
            </Badge>
          ) : null}
          {node.noIndex ? (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <EyeOff className="h-2.5 w-2.5" />
              noindex
            </Badge>
          ) : null}
          {node.articleCount != null && node.articleCount > 0 ? (
            <Badge variant="muted" className="text-[10px]">
              {formatNumber(node.articleCount)} مقاله
            </Badge>
          ) : null}
        </div>

        {canManage ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="عملیات">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!atMaxDepth ? (
                <DropdownMenuItem asChild>
                  <Link href={`/categories/new?parentId=${node.id}`}>
                    <Plus className="h-4 w-4" />
                    افزودن زیردسته
                  </Link>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem asChild>
                <Link href={`/categories/${node.id}/edit`}>
                  <Edit className="h-4 w-4" />
                  ویرایش
                </Link>
              </DropdownMenuItem>
              <ConfirmDialog
                title={`حذف ${node.name}؟`}
                description="اگر این دسته دارای زیردسته یا مقاله باشد، حذف انجام نمی‌شود."
                destructive
                confirmLabel="حذف"
                onConfirm={async () => {
                  try {
                    await categoriesService.remove(node.id);
                    onRemoved();
                    toast.success("دسته حذف شد");
                  } catch (e) {
                    toast.error(parseApiError(e).message);
                  }
                }}
                trigger={
                  <DropdownMenuItem
                    destructive
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف
                  </DropdownMenuItem>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      {expanded && hasChildren ? (
        <div className="mt-0.5 space-y-1">
          {node.children.map((child) => (
            <Branch
              key={child.id}
              node={child}
              canManage={canManage}
              onRemoved={onRemoved}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
