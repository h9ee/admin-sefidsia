"use client";

import * as React from "react";
import {
  Controller,
  type FieldValues,
  type Path,
  useFormContext,
} from "react-hook-form";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Newspaper,
  Search,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "./form-field";
import { cn } from "@/lib/cn";
import { articlesService } from "@/services/articles.service";
import type { Article } from "@/types";

type Props<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  hint?: string;
  required?: boolean;
  max?: number;
};

/**
 * Searchable multi-select picker for "related articles". Stores an ordered
 * number[] of article ids in the form. Editors can re-order with up/down
 * controls; the public site renders the list in exactly this order, so
 * ordering is meaningful (top → bottom in the related-articles rail).
 *
 * Caches the full article object for each selected id so we can show the
 * title chip without an extra round-trip after selection.
 */
export function FormRelatedArticles<T extends FieldValues>({
  name,
  label,
  hint,
  required,
  max = 12,
}: Props<T>) {
  const { control, formState } = useFormContext<T>();
  const error = formState.errors[name]?.message as string | undefined;

  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <RelatedArticlesInner
            value={(field.value as number[]) ?? []}
            onChange={(next) => field.onChange(next)}
            max={max}
          />
        )}
      />
    </FormField>
  );
}

function RelatedArticlesInner({
  value,
  onChange,
  max,
}: {
  value: number[];
  onChange: (next: number[]) => void;
  max: number;
}) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Article[]>([]);
  const [loading, setLoading] = React.useState(false);
  // Local cache of {id → article} so the selected chips can show titles
  // without re-fetching every render. Seeded as new selections arrive.
  const [cache, setCache] = React.useState<Record<string, Article>>({});

  // Hydrate cache for already-selected ids the first time they appear.
  // Runs on every value change but the network call only fires for ids
  // we haven't seen yet — so it's a no-op on the steady state.
  React.useEffect(() => {
    const missing = value.filter((id) => !cache[String(id)]);
    if (missing.length === 0) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await articlesService.list({
          // Send the ids as `q`-free filter so the backend just returns these.
          // (The backend list accepts `ids=` via the query string; we sneak
          // it in as an extra param the typed service doesn't know about.)
          limit: missing.length,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...({ ids: missing.join(",") } as any),
        });
        if (cancelled) return;
        const next = { ...cache };
        for (const a of res.data) next[String(a.id)] = a;
        setCache(next);
      } catch {
        /* swallow — fallback chip shows "#id" only */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Debounced search.
  React.useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await articlesService.list({ q, limit: 12, status: "published" });
        if (!cancelled) setResults(res.data);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const add = (a: Article) => {
    const id = Number(a.id);
    if (!Number.isInteger(id) || id <= 0) return;
    if (value.includes(id)) return;
    if (value.length >= max) return;
    setCache((c) => ({ ...c, [String(id)]: a }));
    onChange([...value, id]);
  };

  const remove = (id: number) => onChange(value.filter((x) => x !== id));

  const move = (id: number, dir: -1 | 1) => {
    const idx = value.indexOf(id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= value.length) return;
    const next = value.slice();
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next);
  };

  // Filter the result dropdown so already-selected articles aren't re-listed.
  const visibleResults = results.filter((a) => !value.includes(Number(a.id)));

  return (
    <div className="space-y-3">
      {/* Selected chips — preserve render order. */}
      {value.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-4 py-6 text-center">
          <Newspaper className="mx-auto h-5 w-5 text-muted-foreground" />
          <p className="mt-1.5 text-xs text-muted-foreground">
            هیچ مقاله‌ای انتخاب نشده. در صورت خالی بودن، فهرست خودکار براساس
            دسته‌بندی نمایش داده می‌شود.
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {value.map((id, i) => {
            const item = cache[String(id)];
            return (
              <li
                key={id}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
              >
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] tabular-nums">
                  {(i + 1).toLocaleString("fa-IR")}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {item?.title ?? `#${id}`}
                  {item?.category?.name ? (
                    <span className="ms-2 text-xs text-muted-foreground">
                      · {item.category.name}
                    </span>
                  ) : null}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => move(id, -1)}
                  disabled={i === 0}
                  aria-label="انتقال به بالا"
                  className="h-7 w-7"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => move(id, 1)}
                  disabled={i === value.length - 1}
                  aria-label="انتقال به پایین"
                  className="h-7 w-7"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(id)}
                  aria-label="حذف"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            value.length >= max
              ? `حداکثر ${max} مقاله قابل انتخاب است`
              : "جست‌وجوی مقاله بر اساس عنوان…"
          }
          className="ps-9"
          disabled={value.length >= max}
        />
        {loading ? (
          <Loader2 className="absolute inset-e-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      {/* Results */}
      {query.trim() && visibleResults.length > 0 && value.length < max && (
        <ul className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-border bg-card p-1">
          {visibleResults.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => add(a)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-md p-2 text-start text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Newspaper className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{a.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {a.category?.name ?? "بدون دسته"}
                    {a.publishedAt
                      ? ` · ${new Date(a.publishedAt).toLocaleDateString("fa-IR")}`
                      : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {query.trim() && !loading && visibleResults.length === 0 && (
        <p className="text-xs text-muted-foreground">
          نتیجه‌ای پیدا نشد.
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          ترتیب: بالا → پایین (همان ترتیب در فرانت نمایش داده می‌شود).
        </p>
        <span
          className={cn(
            "text-[11px] text-muted-foreground tabular-nums",
            value.length >= max && "text-destructive",
          )}
        >
          {value.length.toLocaleString("fa-IR")} /{" "}
          {max.toLocaleString("fa-IR")}
        </span>
      </div>
    </div>
  );
}
