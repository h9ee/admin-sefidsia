"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormInput } from "@/components/forms/form-input";
import { authService } from "@/services/auth.service";
import { parseApiError } from "@/lib/api-error";

const schema = z
  .object({
    currentPassword: z.string().min(6, "رمز فعلی الزامی است"),
    newPassword: z.string().min(6, "حداقل ۶ کاراکتر"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "رمز جدید و تکرار آن یکسان نیست",
    path: ["confirmPassword"],
  });

type Values = z.infer<typeof schema>;

export function PasswordForm() {
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = methods.handleSubmit(async (v) => {
    try {
      await authService.changePassword({
        currentPassword: v.currentPassword,
        newPassword: v.newPassword,
      });
      methods.reset();
      toast.success("رمز عبور با موفقیت تغییر کرد");
    } catch (e) {
      toast.error(parseApiError(e).message);
    }
  });

  return (
    <FormProvider {...methods}>
      <Card>
        <CardHeader>
          <CardTitle>تغییر رمز عبور</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
            <FormInput<Values>
              name="currentPassword"
              label="رمز فعلی"
              type="password"
              dir="ltr"
              required
            />
            <div className="hidden sm:block" />
            <FormInput<Values>
              name="newPassword"
              label="رمز جدید"
              type="password"
              dir="ltr"
              required
            />
            <FormInput<Values>
              name="confirmPassword"
              label="تکرار رمز جدید"
              type="password"
              dir="ltr"
              required
            />
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={methods.formState.isSubmitting}>
                <KeyRound />
                تغییر رمز
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
}
