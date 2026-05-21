import { toast } from "sonner";

export type ToastType = "success" | "error" | "info" | "warning";

/**
 * Thin wrapper over `sonner` so editor / form code can fire toasts with a
 * stable, framework-agnostic signature: `showToast("متن", "error")`.
 */
export function showToast(message: string, type: ToastType = "info"): void {
  switch (type) {
    case "success":
      toast.success(message);
      break;
    case "error":
      toast.error(message);
      break;
    case "warning":
      toast.warning(message);
      break;
    default:
      toast(message);
  }
}
