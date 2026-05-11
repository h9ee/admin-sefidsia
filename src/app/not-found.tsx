import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-10 text-center">
      <p className="text-5xl font-semibold tracking-tight">۴۰۴</p>
      <h2 className="text-base font-medium">صفحه پیدا نشد</h2>
      <p className="text-xs text-muted-foreground">
        نشانی‌ای که وارد کرده‌اید وجود ندارد یا حذف شده است.
      </p>
      <Button asChild>
        <Link href="/dashboard">بازگشت به داشبورد</Link>
      </Button>
    </div>
  );
}
