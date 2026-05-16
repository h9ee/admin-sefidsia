"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronLeft,
  Edit,
  FolderTree,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { FormTextarea } from "@/components/forms/form-textarea";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { usePermission } from "@/hooks/use-permission";
import {
  categoriesService,
  flattenTree,
  indentedLabel,
} from "@/services/categories.service";
import { parseApiError } from "@/lib/api-error";
import { formatNumber, slugify, toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/cn";
import { MAX_CATEGORY_DEPTH, type CategoryNode } from "@/types";

const schema = z.object({
  name: z.string().min(2, "نام الزامی است").max(120),
  slug: z
    .string()
    .min(2)
    .max(160)
    .regex(/^[a-z0-9-]+$/, "فقط حروف کوچک انگلیسی، عدد و -")
    .optional()
    .or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  parentId: z.string(),
});
type Values = z.infer<typeof schema>;

export function CategoriesTree() {
  const { can } = usePermission();
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CategoryNode | null>(null);
  const [presetParent, setPresetParent] = useState<CategoryNode | null>(null);
  const [open, setOpen] = useState(false);

  const load = () => {
    setLoading(true);
    categoriesService
      .listTree()
      .then((t) => setTree(t))
      .catch((e) => toast.error(parseApiError(e).message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const flat = flattenTree(tree);

  return (
    <>
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
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setPresetParent(null);
                setOpen(true);
              }}
            >
              <Plus />
              دسته ریشه
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
                  onAddChild={(parent) => {
                    setEditing(null);
                    setPresetParent(parent);
                    setOpen(true);
                  }}
                  onEdit={(node) => {
                    setEditing(node);
                    setPresetParent(null);
                    setOpen(true);
                  }}
                  onRemoved={load}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CategoryFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        presetParent={presetParent}
        flat={flat}
        onSaved={load}
      />
    </>
  );
}

function Branch({
  node,
  canManage,
  onAddChild,
  onEdit,
  onRemoved,
}: {
  node: CategoryNode;
  canManage: boolean;
  onAddChild: (parent: CategoryNode) => void;
  onEdit: (node: CategoryNode) => void;
  onRemoved: () => void;
}) {
  const [expanded, setExpanded] = useState(node.depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const atMaxDepth = node.depth >= MAX_CATEGORY_DEPTH;

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
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        <div className="flex flex-1 items-center gap-2">
          <span className="text-sm">{node.name}</span>
          <code className="text-[10px] text-muted-foreground" dir="ltr">
            {node.slug}
          </code>
          <Badge variant="outline" className="text-[10px]">
            لایه {toPersianDigits(node.depth)}
          </Badge>
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
                <DropdownMenuItem onClick={() => onAddChild(node)}>
                  <Plus className="h-4 w-4" />
                  افزودن زیردسته
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={() => onEdit(node)}>
                <Edit className="h-4 w-4" />
                ویرایش
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
                  <DropdownMenuItem destructive onSelect={(e) => e.preventDefault()}>
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
              onAddChild={onAddChild}
              onEdit={onEdit}
              onRemoved={onRemoved}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CategoryFormDialog({
  open,
  onOpenChange,
  editing,
  presetParent,
  flat,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: CategoryNode | null;
  presetParent: CategoryNode | null;
  flat: CategoryNode[];
  onSaved: () => void;
}) {
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "", description: "", parentId: "" },
  });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      methods.reset({
        name: editing.name,
        slug: editing.slug,
        description: editing.description ?? "",
        parentId: editing.parentId ? String(editing.parentId) : "",
      });
    } else {
      methods.reset({
        name: "",
        slug: "",
        description: "",
        parentId: presetParent ? String(presetParent.id) : "",
      });
    }
  }, [editing, presetParent, open, methods]);

  const name = methods.watch("name");
  useEffect(() => {
    if (!editing && name) methods.setValue("slug", slugify(name));
  }, [name, editing, methods]);

  // Forbid moving a node under its own descendant.
  const blockedIds = new Set<number>();
  if (editing) {
    const collect = (node: CategoryNode) => {
      blockedIds.add(node.id);
      node.children?.forEach(collect);
    };
    collect(editing);
  }
  // Forbid choosing a parent that's already at MAX depth (can't add deeper child).
  const parentOptions = [
    { label: "— ریشه (بدون والد)", value: "" },
    ...flat
      .filter((n) => !blockedIds.has(n.id) && n.depth < MAX_CATEGORY_DEPTH)
      .map((n) => ({ label: indentedLabel(n), value: String(n.id) })),
  ];

  const onSubmit = methods.handleSubmit(async (values) => {
    try {
      const payload = {
        name: values.name,
        slug: values.slug && values.slug.length > 0 ? values.slug : undefined,
        description:
          values.description && values.description.length > 0
            ? values.description
            : undefined,
        parentId: values.parentId ? Number(values.parentId) : null,
      };
      if (editing) {
        await categoriesService.update(editing.id, payload);
        toast.success("دسته بروزرسانی شد");
      } else {
        await categoriesService.create(payload);
        toast.success("دسته ایجاد شد");
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(parseApiError(e).message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "ویرایش دسته" : "دسته جدید"}</DialogTitle>
          <DialogDescription>
            تا {toPersianDigits(MAX_CATEGORY_DEPTH)} لایه تو در تو پشتیبانی می‌شود.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          <form onSubmit={onSubmit} className="space-y-3">
            <FormInput<Values> name="name" label="نام" required />
            <FormInput<Values>
              name="slug"
              label="شناسه (اختیاری)"
              hint="فقط حروف کوچک انگلیسی، عدد و خط تیره. اگر خالی باشد سرور خودش یکی می‌سازد."
              dir="ltr"
            />
            <FormSelect<Values>
              name="parentId"
              label="دسته والد"
              options={parentOptions}
              placeholder="انتخاب کنید"
            />
            <FormTextarea<Values> name="description" label="توضیحات" rows={2} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                انصراف
              </Button>
              <Button type="submit" disabled={methods.formState.isSubmitting}>
                ذخیره
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
