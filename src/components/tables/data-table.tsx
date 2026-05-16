"use client";

import { type ReactNode, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/cn";
import { formatNumber, toPersianDigits } from "@/lib/format";

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
  width?: string;
};

export type Sort = { key: string; dir: "asc" | "desc" } | null;

type DataTableProps<T extends { id: string | number }> = {
  data: T[];
  columns: Column<T>[];
  rowKey?: (row: T) => string;
  loading?: boolean;
  total?: number;
  page?: number;
  perPage?: number;
  onPageChange?: (page: number) => void;
  search?: string;
  onSearch?: (q: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  toolbar?: ReactNode;
  rowActions?: (row: T) => ReactNode;
  bulkActions?: (selected: T[]) => ReactNode;
  selectable?: boolean;
  sort?: Sort;
  onSortChange?: (sort: Sort) => void;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  rowKey = (r) => String(r.id),
  loading,
  total,
  page = 1,
  perPage = 10,
  onPageChange,
  search,
  onSearch,
  searchPlaceholder = "جستجو…",
  filters,
  toolbar,
  rowActions,
  bulkActions,
  selectable,
  sort,
  onSortChange,
  emptyTitle,
  emptyDescription,
}: DataTableProps<T>) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const allSelected = data.length > 0 && data.every((r) => selected[rowKey(r)]);
  const someSelected = data.some((r) => selected[rowKey(r)]);

  const selectedRows = useMemo(
    () => data.filter((r) => selected[rowKey(r)]),
    [data, selected, rowKey],
  );

  const totalPages = Math.max(1, Math.ceil((total ?? data.length) / perPage));

  const toggleAll = () => {
    if (allSelected) setSelected({});
    else setSelected(Object.fromEntries(data.map((r) => [rowKey(r), true])));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {onSearch ? (
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search ?? ""}
                onChange={(e) => onSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="pe-9"
              />
              {search ? (
                <button
                  type="button"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => onSearch("")}
                  aria-label="پاک کردن"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ) : null}
          {filters}
        </div>
        <div className="flex items-center gap-2">{toolbar}</div>
      </div>

      {bulkActions && someSelected ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 p-2 text-sm">
          <span className="text-muted-foreground">
            {formatNumber(selectedRows.length)} مورد انتخاب شده
          </span>
          <div className="flex flex-wrap items-center gap-1">{bulkActions(selectedRows)}</div>
          <Button
            size="sm"
            variant="ghost"
            className="ms-auto"
            onClick={() => setSelected({})}
          >
            پاک کردن انتخاب
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                {selectable ? (
                  <th className="w-10 px-3 py-3 text-center">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="انتخاب همه"
                    />
                  </th>
                ) : null}
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={cn("px-3 py-3 text-right font-medium", c.className)}
                    style={c.width ? { width: c.width } : undefined}
                  >
                    {c.sortable && onSortChange ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        onClick={() =>
                          onSortChange(
                            !sort || sort.key !== c.key
                              ? { key: c.key, dir: "asc" }
                              : sort.dir === "asc"
                                ? { key: c.key, dir: "desc" }
                                : null,
                          )
                        }
                      >
                        <span>{c.header}</span>
                        {sort?.key === c.key ? (
                          sort.dir === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : null}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                ))}
                {rowActions ? <th className="w-20 px-3 py-3" /> : null}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-border/60">
                    {selectable ? (
                      <td className="px-3 py-3">
                        <Skeleton className="h-4 w-4" />
                      </td>
                    ) : null}
                    {columns.map((c) => (
                      <td key={c.key} className="px-3 py-3">
                        <Skeleton className="h-4 w-3/4" />
                      </td>
                    ))}
                    {rowActions ? (
                      <td className="px-3 py-3">
                        <Skeleton className="h-6 w-6" />
                      </td>
                    ) : null}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      columns.length + (rowActions ? 1 : 0) + (selectable ? 1 : 0)
                    }
                    className="p-0"
                  >
                    <EmptyState title={emptyTitle} description={emptyDescription} className="border-0" />
                  </td>
                </tr>
              ) : (
                data.map((row) => {
                  const id = rowKey(row);
                  const checked = !!selected[id];
                  return (
                    <tr
                      key={id}
                      className={cn(
                        "border-t border-border/60 transition-colors hover:bg-muted/30",
                        checked && "bg-muted/40",
                      )}
                    >
                      {selectable ? (
                        <td className="px-3 py-2.5 text-center">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) =>
                              setSelected((s) => ({ ...s, [id]: !!v }))
                            }
                          />
                        </td>
                      ) : null}
                      {columns.map((c) => (
                        <td key={c.key} className={cn("px-3 py-2.5 align-middle", c.className)}>
                          {c.cell(row)}
                        </td>
                      ))}
                      {rowActions ? (
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            {rowActions(row)}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {onPageChange ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
            {total != null ? <> · جمع: {formatNumber(total)}</> : null}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              قبلی
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              بعدی
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
