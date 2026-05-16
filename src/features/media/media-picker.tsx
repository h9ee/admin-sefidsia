"use client";

import * as React from "react";
import {
  Check,
  FileAudio2,
  FileText,
  ImageIcon,
  Loader2,
  Search,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/cn";
import { mediaUrl } from "@/lib/media-url";
import { parseApiError } from "@/lib/api-error";
import { mediaService, type MediaListParams } from "@/services/media.service";
import type { MediaItem, MediaKind } from "@/types";

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

export type MediaPickerKind = MediaKind | "all";

export interface MediaPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Restrict what can be picked (and what filters show). Default: 'image'. */
  kind?: MediaPickerKind;
  /** Allow multi-select. Default: false. */
  multiple?: boolean;
  onSelect: (items: MediaItem[]) => void;
}

const KIND_LABEL: Record<MediaPickerKind, string> = {
  all: "همه",
  image: "تصویر",
  video: "ویدئو",
  audio: "صدا",
  file: "فایل",
};

const ACCEPT_BY_KIND: Record<MediaPickerKind, string> = {
  all: "image/*,video/*,audio/*,application/pdf",
  image: "image/*",
  video: "video/*",
  audio: "audio/*",
  file: "application/pdf",
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function MediaPicker({
  open,
  onOpenChange,
  kind = "image",
  multiple = false,
  onSelect,
}: MediaPickerProps) {
  const [tab, setTab] = React.useState<"browse" | "upload">("browse");

  // Reset to browse tab when reopened
  React.useEffect(() => {
    if (open) setTab("browse");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl p-0 gap-0 overflow-hidden"
        hideClose
      >
        <DialogHeader className="border-b border-border px-6 py-4 flex flex-row items-center justify-between gap-4">
          <div>
            <DialogTitle>کتابخانه رسانه</DialogTitle>
            <DialogDescription>
              یک {KIND_LABEL[kind]} انتخاب یا یک فایل جدید بارگذاری کنید.
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="بستن"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "browse" | "upload")}
          className="flex flex-col"
        >
          <div className="px-6 pt-4">
            <TabsList>
              <TabsTrigger value="browse">
                <ImageIcon className="h-4 w-4" />
                مرور کتابخانه
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4" />
                بارگذاری جدید
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="browse" className="mt-0">
            <BrowseTab
              kind={kind}
              multiple={multiple}
              onConfirm={(items) => {
                onSelect(items);
                onOpenChange(false);
              }}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>

          <TabsContent value="upload" className="mt-0">
            <UploadTab
              kind={kind}
              onUploaded={(items) => {
                onSelect(items);
                onOpenChange(false);
              }}
              onSwitchToBrowse={() => setTab("browse")}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Browse tab                                                        */
/* ------------------------------------------------------------------ */

function BrowseTab({
  kind,
  multiple,
  onConfirm,
  onCancel,
}: {
  kind: MediaPickerKind;
  multiple: boolean;
  onConfirm: (items: MediaItem[]) => void;
  onCancel: () => void;
}) {
  const [items, setItems] = React.useState<MediaItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  const load = React.useCallback(
    async (opts: { reset?: boolean } = {}) => {
      setLoading(true);
      const nextPage = opts.reset ? 1 : page;
      const params: MediaListParams = {
        page: nextPage,
        limit: 24,
        kind: kind === "all" ? undefined : kind,
        q: q.trim() || undefined,
      };
      try {
        const res = await mediaService.list(params);
        setItems((prev) =>
          opts.reset ? res.data : [...prev, ...res.data],
        );
        setHasMore(res.meta.page < res.meta.totalPages);
        setPage(nextPage);
      } catch (err) {
        toast.error(parseApiError(err).message);
      } finally {
        setLoading(false);
      }
    },
    [kind, q, page],
  );

  // First load + when filter changes
  React.useEffect(() => {
    setPage(1);
    setSelectedIds([]);
    void load({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  // Debounce search
  React.useEffect(() => {
    const id = setTimeout(() => {
      setPage(1);
      void load({ reset: true });
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const toggle = (id: number) => {
    setSelectedIds((prev) => {
      if (multiple) {
        return prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      }
      return prev[0] === id ? [] : [id];
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("این فایل برای همیشه حذف می‌شود. ادامه می‌دهید؟")) return;
    setDeletingId(id);
    try {
      await mediaService.remove(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setSelectedIds((prev) => prev.filter((p) => p !== id));
      toast.success("فایل حذف شد");
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setDeletingId(null);
    }
  };

  const selected = items.filter((i) => selectedIds.includes(i.id));

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-6 py-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجو بر اساس نام، عنوان یا متن جایگزین…"
            className="ps-9"
          />
        </div>
      </div>

      {/* Grid */}
      <ScrollArea className="h-[480px]">
        <div className="px-6 py-4">
          {loading && items.length === 0 ? (
            <GridSkeleton />
          ) : items.length === 0 ? (
            <EmptyState onUpload={onCancel} />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {items.map((item) => (
                  <MediaTile
                    key={item.id}
                    item={item}
                    selected={selectedIds.includes(item.id)}
                    onToggle={() => toggle(item.id)}
                    onDelete={() => handleDelete(item.id)}
                    deleting={deletingId === item.id}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPage((p) => p + 1);
                      // page state updates async; refetch with next page
                      void mediaService
                        .list({
                          page: page + 1,
                          limit: 24,
                          kind: kind === "all" ? undefined : kind,
                          q: q.trim() || undefined,
                        })
                        .then((res) => {
                          setItems((prev) => [...prev, ...res.data]);
                          setHasMore(res.meta.page < res.meta.totalPages);
                        });
                    }}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    بارگذاری بیشتر
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-3">
        <div className="text-xs text-muted-foreground">
          {selected.length > 0
            ? `${selected.length.toLocaleString("fa-IR")} مورد انتخاب شد`
            : "موردی انتخاب نشده"}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            انصراف
          </Button>
          <Button
            type="button"
            disabled={selected.length === 0}
            onClick={() => onConfirm(selected)}
          >
            <Check className="h-4 w-4" />
            انتخاب
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Upload tab                                                        */
/* ------------------------------------------------------------------ */

type UploadEntry = {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  message?: string;
  result?: MediaItem;
  abort?: AbortController;
};

function UploadTab({
  kind,
  onUploaded,
  onSwitchToBrowse,
}: {
  kind: MediaPickerKind;
  onUploaded: (items: MediaItem[]) => void;
  onSwitchToBrowse: () => void;
}) {
  const [entries, setEntries] = React.useState<UploadEntry[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const accept = ACCEPT_BY_KIND[kind];

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    const newEntries: UploadEntry[] = list.map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      progress: 0,
      status: "pending",
    }));
    setEntries((prev) => [...prev, ...newEntries]);
    void Promise.all(newEntries.map((e) => uploadEntry(e)));
  };

  const uploadEntry = async (entry: UploadEntry) => {
    const abort = new AbortController();
    updateEntry(entry.id, { status: "uploading", abort });
    try {
      const result = await mediaService.upload({
        file: entry.file,
        signal: abort.signal,
        onProgress: (p) => updateEntry(entry.id, { progress: p }),
      });
      updateEntry(entry.id, {
        status: "done",
        progress: 1,
        result,
      });
    } catch (err) {
      const err2 = err as { name?: string };
      if (err2?.name === "CanceledError" || err2?.name === "AbortError") {
        updateEntry(entry.id, { status: "error", message: "لغو شد" });
      } else {
        updateEntry(entry.id, {
          status: "error",
          message: parseApiError(err).message,
        });
      }
    }
  };

  const updateEntry = (id: string, patch: Partial<UploadEntry>) =>
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );

  const cancelEntry = (id: string) => {
    const e = entries.find((x) => x.id === id);
    e?.abort?.abort();
  };

  const removeEntry = (id: string) =>
    setEntries((prev) => prev.filter((e) => e.id !== id));

  const onDrop = (ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    setIsDragging(false);
    if (ev.dataTransfer?.files?.length) addFiles(ev.dataTransfer.files);
  };

  const doneItems = entries
    .filter((e) => e.status === "done" && e.result)
    .map((e) => e.result!) as MediaItem[];

  const anyInFlight = entries.some(
    (e) => e.status === "uploading" || e.status === "pending",
  );

  return (
    <div className="flex flex-col">
      <ScrollArea className="h-[480px]">
        <div className="px-6 py-4 space-y-4">
          {/* Dropzone */}
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              if (e.currentTarget === e.target) setIsDragging(false);
            }}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            className={cn(
              "group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-card px-6 py-12 text-center cursor-pointer transition-all",
              isDragging
                ? "border-foreground bg-muted/60 scale-[1.01]"
                : "border-border hover:border-foreground/50 hover:bg-muted/30",
            )}
          >
            <div
              className={cn(
                "rounded-full bg-muted p-4 transition-transform",
                isDragging && "scale-110",
              )}
            >
              <Upload className="h-7 w-7" />
            </div>
            <div>
              <p className="font-semibold">فایل را اینجا رها کنید</p>
              <p className="text-sm text-muted-foreground mt-1">
                یا کلیک کنید تا از سیستم انتخاب کنید
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              نوع‌های مجاز: {ACCEPT_LABEL[kind]} — حداکثر ۵۰ مگابایت
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {/* Upload list */}
          {entries.length > 0 && (
            <div className="space-y-2">
              {entries.map((entry) => (
                <UploadRow
                  key={entry.id}
                  entry={entry}
                  onCancel={() => cancelEntry(entry.id)}
                  onRemove={() => removeEntry(entry.id)}
                  onRetry={() => {
                    updateEntry(entry.id, {
                      progress: 0,
                      status: "pending",
                      message: undefined,
                    });
                    void uploadEntry(entry);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-3">
        <div className="text-xs text-muted-foreground">
          {doneItems.length > 0
            ? `${doneItems.length.toLocaleString("fa-IR")} فایل آماده درج`
            : "هنوز چیزی بارگذاری نشده"}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={onSwitchToBrowse}>
            مرور کتابخانه
          </Button>
          <Button
            type="button"
            disabled={doneItems.length === 0 || anyInFlight}
            onClick={() => onUploaded(doneItems)}
          >
            <Check className="h-4 w-4" />
            استفاده در فرم
          </Button>
        </div>
      </div>
    </div>
  );
}

const ACCEPT_LABEL: Record<MediaPickerKind, string> = {
  all: "تصویر، ویدئو، صدا، PDF",
  image: "JPG, PNG, WEBP, AVIF, GIF, SVG",
  video: "MP4, WEBM, MOV",
  audio: "MP3, OGG, WAV, M4A",
  file: "PDF",
};

/* ------------------------------------------------------------------ */
/*  Pieces                                                            */
/* ------------------------------------------------------------------ */

function MediaTile({
  item,
  selected,
  onToggle,
  onDelete,
  deleting,
}: {
  item: MediaItem;
  selected: boolean;
  onToggle: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-card text-start transition-all",
        selected
          ? "border-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background"
          : "border-border hover:border-foreground/50",
      )}
    >
      <div className="aspect-square bg-muted relative overflow-hidden">
        <MediaPreview item={item} />
        {selected && (
          <div className="absolute inset-0 bg-foreground/10 flex items-center justify-center">
            <div className="rounded-full bg-foreground text-background p-2">
              <Check className="h-4 w-4" />
            </div>
          </div>
        )}
        <span className="absolute top-1 start-1 rounded-md bg-black/60 text-white text-[10px] px-1.5 py-0.5 backdrop-blur-sm">
          {KIND_LABEL[item.kind]}
        </span>
      </div>
      <div className="p-2 space-y-0.5">
        <div className="truncate text-xs font-medium" title={item.originalName}>
          {item.title || item.originalName}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {formatSize(item.size)}
          {item.width && item.height
            ? ` • ${item.width}×${item.height}`
            : ""}
        </div>
      </div>

      {/* Delete on hover */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        disabled={deleting}
        className={cn(
          "absolute top-1 end-1 rounded-md bg-black/60 text-white p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600",
          deleting && "opacity-100",
        )}
        aria-label="حذف"
      >
        {deleting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </button>
    </button>
  );
}

function MediaPreview({ item }: { item: MediaItem }) {
  const src = mediaUrl(item.thumbnailUrl ?? item.url);

  if (item.kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={item.alt ?? item.originalName}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
    );
  }
  if (item.kind === "video") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-white">
        <Video className="h-8 w-8" />
      </div>
    );
  }
  if (item.kind === "audio") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-white">
        <FileAudio2 className="h-8 w-8" />
      </div>
    );
  }
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-muted">
      <FileText className="h-8 w-8 text-muted-foreground" />
    </div>
  );
}

function UploadRow({
  entry,
  onCancel,
  onRemove,
  onRetry,
}: {
  entry: UploadEntry;
  onCancel: () => void;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const pct = Math.round(entry.progress * 100);
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
        {entry.file.type.startsWith("image/") ? (
          <ImageIcon className="h-4 w-4" />
        ) : entry.file.type.startsWith("video/") ? (
          <Video className="h-4 w-4" />
        ) : entry.file.type.startsWith("audio/") ? (
          <FileAudio2 className="h-4 w-4" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate text-sm font-medium" title={entry.file.name}>
            {entry.file.name}
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {entry.status === "uploading"
              ? `${pct}%`
              : entry.status === "done"
                ? "تکمیل شد"
                : entry.status === "error"
                  ? "ناموفق"
                  : "در انتظار"}
          </div>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full transition-all duration-200",
              entry.status === "error"
                ? "bg-destructive"
                : entry.status === "done"
                  ? "bg-emerald-500"
                  : "bg-foreground",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{formatSize(entry.file.size)}</span>
          {entry.message && (
            <span className="truncate text-destructive">{entry.message}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {entry.status === "uploading" && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="لغو"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {entry.status === "error" && (
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            تلاش مجدد
          </Button>
        )}
        {(entry.status === "done" || entry.status === "error") && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="حذف از فهرست"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-border">
          <Skeleton className="aspect-square w-full" />
          <div className="p-2 space-y-1.5">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4">
        <ImageIcon className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="mt-4 font-semibold">فایلی در کتابخانه نیست</p>
      <p className="mt-1 text-sm text-muted-foreground">
        از تب «بارگذاری جدید» اولین فایل را اضافه کنید.
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-4"
        onClick={onUpload}
      >
        <Upload className="h-4 w-4" />
        بارگذاری فایل
      </Button>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
