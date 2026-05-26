import { AxiosError } from "axios";
import type { ApiError, ApiFailureEnvelope } from "@/types";

export function parseApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as ApiFailureEnvelope | undefined;
    const base = data?.message ?? translateStatus(status);
    // Surface field-level reasons (e.g. "انتخاب دسته‌بندی الزامی است") instead of
    // only the generic top message, so the user knows which field is wrong.
    const details = extractDetailMessages(data?.details);
    return {
      status,
      message: details.length ? `${base}: ${details.join("، ")}` : base,
      code: data?.code,
      details: data?.details,
    };
  }
  if (error instanceof Error) {
    return { status: 0, message: error.message };
  }
  return { status: 0, message: "خطای ناشناخته رخ داد" };
}

/** Pull human-readable messages out of the backend's `details` payload. */
function extractDetailMessages(details: unknown): string[] {
  if (!Array.isArray(details)) return [];
  const out: string[] = [];
  for (const d of details) {
    if (d && typeof d === "object" && "message" in d) {
      const m = (d as { message?: unknown }).message;
      if (typeof m === "string" && m.trim()) out.push(m.trim());
    }
  }
  // De-duplicate; cap to keep the toast readable.
  return Array.from(new Set(out)).slice(0, 4);
}

function translateStatus(status: number): string {
  switch (status) {
    case 0:
      return "ارتباط با سرور برقرار نشد";
    case 400:
      return "درخواست نامعتبر است";
    case 401:
      return "نشست شما منقضی شده است";
    case 403:
      return "اجازه دسترسی ندارید";
    case 404:
      return "موردی یافت نشد";
    case 409:
      return "تعارض در داده‌ها";
    case 422:
      return "اطلاعات وارد شده معتبر نیست";
    case 429:
      return "تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید";
    case 500:
      return "خطای سرور";
    default:
      return "خطایی رخ داد";
  }
}
