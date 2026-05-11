"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h2 className="text-base font-semibold">مشکلی در نمایش این صفحه پیش آمد</h2>
      <p className="max-w-sm text-xs text-muted-foreground">
        {error.message || "خطای ناشناخته. می‌توانید دوباره تلاش کنید."}
      </p>
      <Button onClick={reset}>تلاش دوباره</Button>
    </div>
  );
}
