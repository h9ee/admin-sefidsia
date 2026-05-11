"use client";

import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormInput } from "@/components/forms/form-input";
import { useAuthStore } from "@/store/auth.store";
import { usersService } from "@/services/users.service";
import { parseApiError } from "@/lib/api-error";

const schema = z.object({
  fullName: z.string().min(2, "نام را وارد کنید"),
  email: z.string().email("ایمیل معتبر نیست"),
  phone: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function ProfileForm() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", phone: "" },
  });

  useEffect(() => {
    if (user) {
      methods.reset({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone ?? "",
      });
    }
  }, [user, methods]);

  const onSubmit = methods.handleSubmit(async (values) => {
    if (!user) return;
    try {
      const updated = await usersService.update(user.id, values);
      setUser(updated);
      toast.success("اطلاعات بروزرسانی شد");
    } catch (e) {
      toast.error(parseApiError(e).message);
    }
  });

  return (
    <FormProvider {...methods}>
      <Card>
        <CardHeader>
          <CardTitle>پروفایل من</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
            <FormInput<Values> name="fullName" label="نام و نام خانوادگی" required />
            <FormInput<Values> name="email" label="ایمیل" type="email" dir="ltr" required />
            <FormInput<Values> name="phone" label="موبایل" dir="ltr" />
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={methods.formState.isSubmitting}>
                <Save />
                ذخیره
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
}
