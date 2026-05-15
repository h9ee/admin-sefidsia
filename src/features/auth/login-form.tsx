"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { parseApiError } from "@/lib/api-error";
import {
  isValidIranianMobile,
  maskMobile,
  normalizeMobile,
  toPersianDigits,
} from "@/lib/mobile";
import type { User } from "@/types";

type Step =
  | { kind: "mobile" }
  | { kind: "password"; mobile: string }
  | { kind: "otp"; mobile: string; purpose: "login" | "reset"; expiresAt: number }
  | { kind: "set-password"; mode: "initial" | "reset"; resetToken?: string };

const OTP_LENGTH = 5;

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/dashboard";
  const setSession = useAuthStore((s) => s.setSession);
  const setUser = useAuthStore((s) => s.setUser);
  const [step, setStep] = React.useState<Step>({ kind: "mobile" });

  function finish() {
    document.cookie = `ss-auth-presence=1; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    router.replace(next);
  }

  return (
    <div className="space-y-4">
      {step.kind !== "mobile" && (
        <button
          type="button"
          onClick={() => setStep({ kind: "mobile" })}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="h-3 w-3" />
          تغییر شماره موبایل
        </button>
      )}

      {step.kind === "mobile" && (
        <MobileStep
          onContinue={(mobile, hasPassword) => {
            if (hasPassword) setStep({ kind: "password", mobile });
            else
              setStep({
                kind: "otp",
                mobile,
                purpose: "login",
                expiresAt: Date.now() + 120_000,
              });
          }}
        />
      )}

      {step.kind === "password" && (
        <PasswordStep
          mobile={step.mobile}
          onSuccess={(user, tokens) => {
            setSession({ user, tokens });
            toast.success(`خوش آمدید، ${user.firstName ?? user.username}`);
            finish();
          }}
          onForgot={async () => {
            try {
              await authService.requestOtp({
                mobile: step.mobile,
                purpose: "reset",
              });
              toast.success("کد بازیابی به موبایل شما ارسال شد.");
              setStep({
                kind: "otp",
                mobile: step.mobile,
                purpose: "reset",
                expiresAt: Date.now() + 120_000,
              });
            } catch (err) {
              toast.error(parseApiError(err).message);
            }
          }}
        />
      )}

      {step.kind === "otp" && (
        <OtpStep
          mobile={step.mobile}
          purpose={step.purpose}
          expiresAt={step.expiresAt}
          onResend={(newExpires) =>
            setStep({ ...step, expiresAt: newExpires })
          }
          onLoginVerified={(payload) => {
            setSession({ user: payload.user, tokens: payload.tokens });
            if (payload.shouldSuggestPassword) {
              setStep({ kind: "set-password", mode: "initial" });
            } else {
              toast.success("ورود موفق");
              finish();
            }
          }}
          onResetVerified={(resetToken) => {
            setStep({ kind: "set-password", mode: "reset", resetToken });
          }}
        />
      )}

      {step.kind === "set-password" && (
        <SetPasswordStep
          mode={step.mode}
          resetToken={step.resetToken}
          onDone={async () => {
            toast.success(
              step.mode === "reset"
                ? "رمز عبور تغییر کرد."
                : "رمز عبور تنظیم شد."
            );
            try {
              const u = await authService.me();
              setUser(u);
            } catch {
              /* ignore */
            }
            finish();
          }}
          onSkip={() => {
            toast.success("ورود موفق");
            finish();
          }}
        />
      )}
    </div>
  );
}

/* ----------------------------- Step 1 ----------------------------- */
function MobileStep({
  onContinue,
}: {
  onContinue: (mobile: string, hasPassword: boolean) => void;
}) {
  const [mobile, setMobile] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const m = normalizeMobile(mobile);
    if (!isValidIranianMobile(m)) {
      setError("شماره موبایل معتبر نیست. مثال: ۰۹۱۲۳۴۵۶۷۸۹");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { hasPassword } = await authService.checkMobile(m);
      if (!hasPassword) {
        await authService.requestOtp({ mobile: m, purpose: "login" });
        toast.success("کد یکبارمصرف ارسال شد.");
      }
      onContinue(m, hasPassword);
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="mobile">شماره موبایل</Label>
        <Input
          id="mobile"
          inputMode="numeric"
          autoComplete="tel"
          dir="ltr"
          placeholder="09xxxxxxxxx"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby="mobile-error"
          maxLength={14}
        />
        {error && (
          <p id="mobile-error" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={busy || !mobile.trim()}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        ادامه
      </Button>
    </form>
  );
}

/* --------------------------- Step 2A (password) --------------------------- */
function PasswordStep({
  mobile,
  onSuccess,
  onForgot,
}: {
  mobile: string;
  onSuccess: (
    user: User,
    tokens: { accessToken: string; refreshToken: string }
  ) => void;
  onForgot: () => void;
}) {
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("رمز عبور حداقل ۶ کاراکتر باشد.");
      return;
    }
    setBusy(true);
    try {
      const res = await authService.loginWithPassword({ mobile, password });
      onSuccess(res.user, res.tokens);
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground text-center">
        ورود برای{" "}
        <span className="text-foreground font-medium" dir="ltr">
          {maskMobile(mobile)}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">رمز عبور</Label>
          <button
            type="button"
            onClick={onForgot}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            رمز را فراموش کرده‌اید؟
          </button>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="pe-10"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "مخفی کردن رمز" : "نمایش رمز"}
            className="absolute end-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        ورود
      </Button>
    </form>
  );
}

/* ----------------------------- Step 2B (OTP) ----------------------------- */
function OtpStep({
  mobile,
  purpose,
  expiresAt,
  onResend,
  onLoginVerified,
  onResetVerified,
}: {
  mobile: string;
  purpose: "login" | "reset";
  expiresAt: number;
  onResend: (newExpiresAt: number) => void;
  onLoginVerified: (data: {
    user: User;
    tokens: { accessToken: string; refreshToken: string };
    shouldSuggestPassword: boolean;
  }) => void;
  onResetVerified: (resetToken: string) => void;
}) {
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [remaining, setRemaining] = React.useState(
    Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
  );

  React.useEffect(() => {
    const t = setInterval(() => {
      setRemaining(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < 4) {
      toast.error("کد را کامل وارد کنید.");
      return;
    }
    setBusy(true);
    try {
      const res = await authService.verifyOtp({ mobile, code, purpose });
      if (res.kind === "login") {
        onLoginVerified({
          user: res.user,
          tokens: res.tokens,
          shouldSuggestPassword: res.shouldSuggestPassword,
        });
      } else {
        onResetVerified(res.resetToken);
      }
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setResending(true);
    try {
      await authService.requestOtp({ mobile, purpose });
      toast.success("کد جدید ارسال شد.");
      onResend(Date.now() + 120_000);
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <p className="text-sm">
          کد {OTP_LENGTH} رقمی ارسال‌شده به{" "}
          <span className="text-foreground font-medium" dir="ltr">
            {maskMobile(mobile)}
          </span>{" "}
          را وارد کنید.
        </p>
      </div>

      <Input
        id="otp"
        inputMode="numeric"
        autoComplete="one-time-code"
        dir="ltr"
        maxLength={OTP_LENGTH + 2}
        value={code}
        onChange={(e) =>
          setCode(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH + 2))
        }
        autoFocus
        placeholder={"—".repeat(OTP_LENGTH)}
        className="h-14 text-center text-2xl tracking-[0.5em] font-mono"
        aria-label="کد یکبارمصرف"
      />

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={busy || code.length < 4}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        تایید کد
      </Button>

      <div className="text-center text-xs text-muted-foreground">
        {remaining > 0 ? (
          <>
            ارسال مجدد تا{" "}
            <span className="tabular-nums text-foreground">
              {toPersianDigits(Math.floor(remaining / 60))}:
              {toPersianDigits(String(remaining % 60).padStart(2, "0"))}
            </span>{" "}
            دیگر
          </>
        ) : (
          <button
            type="button"
            onClick={resend}
            disabled={resending}
            className="text-foreground font-medium hover:underline disabled:opacity-50"
          >
            {resending ? "در حال ارسال…" : "ارسال مجدد کد"}
          </button>
        )}
      </div>
    </form>
  );
}

/* ----------------- Step 3 (set initial password / reset) ----------------- */
function SetPasswordStep({
  mode,
  resetToken,
  onDone,
  onSkip,
}: {
  mode: "initial" | "reset";
  resetToken?: string;
  onDone: () => void;
  onSkip: () => void;
}) {
  const [pwd, setPwd] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.length < 8) {
      toast.error("رمز عبور حداقل ۸ کاراکتر باشد.");
      return;
    }
    if (pwd !== confirm) {
      toast.error("رمز عبور و تکرار آن یکسان نیستند.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "reset") {
        if (!resetToken) throw new Error("توکن بازیابی نامعتبر است.");
        await authService.resetPassword({ resetToken, password: pwd });
      } else {
        await authService.setPassword(pwd);
      }
      onDone();
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="font-bold text-lg">
          {mode === "reset" ? "رمز عبور جدید" : "یک رمز عبور تنظیم کنید"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {mode === "reset"
            ? "برای ادامه، رمز عبور جدید خود را وارد کنید."
            : "ورود سریع‌تر در دفعات بعدی — اختیاری است."}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pwd">رمز عبور</Label>
        <div className="relative">
          <Input
            id="pwd"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            dir="ltr"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            autoFocus
            className="pe-10"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "مخفی کردن رمز" : "نمایش رمز"}
            className="absolute end-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          حداقل ۸ کاراکتر؛ ترکیبی از حرف و عدد توصیه می‌شود.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm">تکرار رمز عبور</Label>
        <Input
          id="confirm"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          dir="ltr"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        {mode === "initial" && (
          <Button
            type="button"
            variant="outline"
            onClick={onSkip}
            size="lg"
            className="flex-1"
            disabled={busy}
          >
            بعداً
          </Button>
        )}
        <Button
          type="submit"
          size="lg"
          className="flex-1"
          disabled={busy || !pwd || !confirm}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          ذخیره رمز
        </Button>
      </div>
    </form>
  );
}
