export type MediaKind = "image" | "video" | "audio" | "file";

export type MediaItem = {
  id: number;
  uploaderId: number | null;
  kind: MediaKind;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl: string | null;
  filename: string;
  originalName: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  alt: string | null;
  title: string | null;
  folder: string | null;
  checksum: string;
  createdAt: string;
  updatedAt: string;
};
