import { AxiosError } from "axios";
import type { ApiError } from "@/types";

export function parseApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;
    return {
      status,
      message: data?.message ?? translateStatus(status),
      errors: data?.errors,
    };
  }
  if (error instanceof Error) {
    return { status: 0, message: error.message };
  }
  return { status: 0, message: "خطای ناشناخته رخ داد" };
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
