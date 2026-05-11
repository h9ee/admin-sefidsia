"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/forms/form-input";
import { FormSwitch } from "@/components/forms/form-switch";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { parseApiError } from "@/lib/api-error";

const schema = z.object({
  email: z.string().min(1, "ایمیل الزامی است").email("ایمیل معتبر نیست"),
  password: z.string().min(6, "رمز عبور حداقل ۶ کاراکتر است"),
  rememberMe: z.boolean().optional(),
});

type Values = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/dashboard";
  const setSession = useAuthStore((s) => s.setSession);
  const [showPassword, setShowPassword] = useState(false);

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  const onSubmit = methods.handleSubmit(async (values) => {
    try {
      const session = await authService.login(values);
      setSession(session);
      // Mirror presence to a cookie so proxy.ts can short-circuit
      document.cookie = `ss-auth-presence=1; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      toast.success("خوش آمدید");
      router.replace(next);
    } catch (e) {
      const err = parseApiError(e);
      toast.error(err.message);
    }
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormInput<Values>
          name="email"
          label="ایمیل"
          required
          type="email"
          placeholder="example@domain.com"
          autoComplete="email"
          dir="ltr"
        />
        <div className="relative">
          <FormInput<Values>
            name="password"
            label="رمز عبور"
            required
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            dir="ltr"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute left-3 top-[34px] text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "مخفی کردن" : "نمایش"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <FormSwitch<Values> name="rememberMe" label="مرا به خاطر بسپار" />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={methods.formState.isSubmitting}
        >
          {methods.formState.isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          ورود
        </Button>
      </form>
    </FormProvider>
  );
}
