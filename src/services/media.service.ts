import { api, apiDelete, apiList, apiPatch } from "@/lib/axios";
import type { MediaItem, MediaKind, Paginated } from "@/types";

export type MediaListParams = {
  page?: number;
  limit?: number;
  kind?: MediaKind | "all";
  q?: string;
  folder?: string;
};

export type MediaUploadInput = {
  file: File;
  alt?: string;
  title?: string;
  folder?: string;
  /** Receives a 0..1 progress value during upload. */
  onProgress?: (progress: number) => void;
  /** Pass an AbortSignal to cancel mid-flight. */
  signal?: AbortSignal;
};

export const mediaService = {
  list(params: MediaListParams = {}): Promise<Paginated<MediaItem>> {
    return apiList<MediaItem>("/media", params);
  },

  folders(): Promise<string[]> {
    return api
      .get<{ data: string[] }>("/media/folders")
      .then((r) => r.data.data ?? []);
  },

  async upload(input: MediaUploadInput): Promise<MediaItem> {
    const form = new FormData();
    form.append("file", input.file);
    if (input.alt) form.append("alt", input.alt);
    if (input.title) form.append("title", input.title);
    if (input.folder) form.append("folder", input.folder);

    const res = await api.post<{ data: MediaItem }>("/media", form, {
      headers: { "Content-Type": "multipart/form-data" },
      signal: input.signal,
      onUploadProgress: (e) => {
        if (!input.onProgress) return;
        const total = e.total ?? input.file.size;
        if (!total) return;
        input.onProgress(Math.min(1, e.loaded / total));
      },
    });
    return res.data.data;
  },

  update(
    id: number,
    patch: { alt?: string | null; title?: string | null; folder?: string | null }
  ): Promise<MediaItem> {
    return apiPatch<MediaItem>(`/media/${id}`, patch);
  },

  remove(id: number): Promise<void> {
    return apiDelete<void>(`/media/${id}`);
  },
};
