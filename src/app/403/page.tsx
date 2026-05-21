import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Forbidden() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldX className="h-7 w-7" />
      </div>
      <p className="text-5xl font-semibold tracking-tight">۴۰۳</p>
      <h2 className="text-base font-medium">دسترسی غیرمجاز</h2>
      <p className="max-w-xs text-xs text-muted-foreground">
        شما دسترسی لازم برای مشاهده این صفحه را ندارید. در صورت نیاز با مدیر سیستم
        تماس بگیرید.
      </p>
      <Button asChild>
        <Link href="/dashboard">بازگشت به داشبورد</Link>
      </Button>
    </div>
  );
}
