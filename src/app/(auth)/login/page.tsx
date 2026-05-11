import { Suspense } from "react";
import { LoginForm } from "@/features/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "ورود — سفید و سیاه" };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-foreground text-background lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background text-foreground">
            <span className="text-lg font-bold">س</span>
          </div>
          <div>
            <p className="text-base font-semibold">سفید و سیاه</p>
            <p className="text-xs text-background/60">پلتفرم سلامت</p>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-3xl font-semibold leading-tight text-balance">
            ساده، سریع و حرفه‌ای؛
            <br />
            مدیریت در سیاه و سفید.
          </h1>
          <p className="max-w-md text-sm text-background/70">
            داشبورد مدیریت سفید و سیاه برای مدیریت محتوا، کاربران، پزشکان، گزارش‌ها و
            نظارت بر پلتفرم سلامت طراحی شده است. تجربه‌ای مینیمال، با تمرکز بر سرعت و
            کارایی.
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs text-background/60">
            <Stat label="کاربران" />
            <Stat label="پزشکان" />
            <Stat label="مقالات" />
          </div>
        </div>

        <p className="text-xs text-background/40">© سفید و سیاه — تمامی حقوق محفوظ است.</p>
      </div>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <Card className="w-full max-w-sm border-border/70">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground lg:hidden">
              <span className="text-lg font-bold">س</span>
            </div>
            <CardTitle className="text-xl">ورود به پنل</CardTitle>
            <CardDescription>برای ادامه، اطلاعات حساب خود را وارد کنید.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-background/10 px-3 py-2 text-center">
      <span>{label}</span>
    </div>
  );
}
