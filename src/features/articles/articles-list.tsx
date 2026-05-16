"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Edit, Eye, MoreHorizontal, Plus, Trash2, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { usePermission } from "@/hooks/use-permission";
import { articlesService } from "@/services/articles.service";
import { parseApiError } from "@/lib/api-error";
import { formatDate } from "@/lib/format";
import { displayName } from "@/lib/user";
import type { Article, ArticleStatus, Paginated } from "@/types";

export function ArticlesList() {
  const { can } = usePermission();
  const [data, setData] = useState<Paginated<Article> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ArticleStatus | "all">("all");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    articlesService
      .list({
        page,
        limit: 10,
        q: search || undefined,
        status: status === "all" ? undefined : status,
      })
      .then((res) => active && setData(res))
      .catch(() =>
        active &&
        setData({ data: [], meta: { page, limit: 10, total: 0, totalPages: 1 } }),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, search, status, reload]);

  const columns = useMemo<Column<Article>[]>(
    () => [
      {
        key: "title",
        header: "عنوان",
        cell: (a) => (
          <div className="flex items-start gap-3">
            <div className="h-12 w-16 shrink-0 rounded-md border border-border bg-muted">
              {a.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.coverImage}
                  alt=""
                  className="h-full w-full rounded-md object-cover"
                />
              ) : null}
            </div>
            <div className="leading-tight">
              <Link
                href={`/articles/${a.slug}`}
                className="line-clamp-1 text-sm font-medium hover:underline"
              >
                {a.title}
              </Link>
              <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground" dir="ltr">
                {a.slug}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {a.tags?.slice(0, 3).map((t) => (
                  <Badge key={t.id} variant="outline" className="text-[10px]">
                    {t.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "author",
        header: "نویسنده",
        cell: (a) => <span className="text-xs">{displayName(a.author)}</span>,
      },
      {
        key: "category",
        header: "دسته",
        cell: (a) =>
          a.category ? (
            <Badge variant="muted" className="text-[10px]">
              {a.category.name}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        key: "medicalReview",
        header: "بازبینی پزشک",
        cell: (a) => <StatusBadge status={a.medicalReviewStatus} />,
      },
      {
        key: "status",
        header: "وضعیت",
        cell: (a) => <StatusBadge status={a.status} />,
      },
      {
        key: "publishedAt",
        header: "انتشار",
        sortable: true,
        cell: (a) => (
          <span className="text-xs text-muted-foreground">
            {a.publishedAt ? formatDate(a.publishedAt) : "—"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable<Article>
      data={data?.data ?? []}
      total={data?.meta.total}
      page={page}
      perPage={data?.meta.limit ?? 10}
      onPageChange={setPage}
      search={search}
      onSearch={(q) => {
        setSearch(q);
        setPage(1);
      }}
      searchPlaceholder="جستجو در مقالات…"
      loading={loading}
      columns={columns}
      filters={
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as ArticleStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
            <SelectItem value="draft">پیش‌نویس</SelectItem>
            <SelectItem value="pending_review">نیازمند بازبینی</SelectItem>
            <SelectItem value="published">منتشر شده</SelectItem>
            <SelectItem value="rejected">رد شده</SelectItem>
            <SelectItem value="archived">بایگانی</SelectItem>
          </SelectContent>
        </Select>
      }
      toolbar={
        <PermissionGuard permission="articles.create">
          <Button asChild>
            <Link href="/articles/new">
              <Plus />
              مقاله جدید
            </Link>
          </Button>
        </PermissionGuard>
      }
      rowActions={(a) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/articles/${a.slug}`}>
                <Eye className="h-4 w-4" />
                مشاهده / ویرایش
              </Link>
            </DropdownMenuItem>
            {can("articles.update") ? (
              <DropdownMenuItem asChild>
                <Link href={`/articles/${a.slug}`}>
                  <Edit className="h-4 w-4" />
                  ویرایش
                </Link>
              </DropdownMenuItem>
            ) : null}
            {can("articles.publish") && a.status !== "published" ? (
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await articlesService.publish(a.id);
                    setReload((x) => x + 1);
                    toast.success("مقاله برای انتشار ارسال شد");
                  } catch (e) {
                    toast.error(parseApiError(e).message);
                  }
                }}
              >
                <Send className="h-4 w-4" />
                انتشار
              </DropdownMenuItem>
            ) : null}
            {can("articles.delete") ? (
              <>
                <DropdownMenuSeparator />
                <ConfirmDialog
                  title={`حذف ${a.title}؟`}
                  description="این عملیات قابل بازگشت نیست."
                  destructive
                  confirmLabel="حذف"
                  onConfirm={async () => {
                    try {
                      await articlesService.remove(a.id);
                      setReload((x) => x + 1);
                      toast.success("مقاله حذف شد");
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
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  );
}
