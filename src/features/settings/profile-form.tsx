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
import { FormTextarea } from "@/components/forms/form-textarea";
import { useAuthStore } from "@/store/auth.store";
import { usersService } from "@/services/users.service";
import { parseApiError } from "@/lib/api-error";

const schema = z.object({
  firstName: z.string().min(1).max(80).optional().or(z.literal("")),
  lastName: z.string().min(1).max(80).optional().or(z.literal("")),
  email: z.string().email("ایمیل معتبر نیست").optional().or(z.literal("")),
  mobile: z
    .string()
    .regex(/^09\d{9}$/, "موبایل ایرانی معتبر وارد کنید")
    .optional()
    .or(z.literal("")),
  bio: z.string().max(2000).optional().or(z.literal("")),
  avatar: z.string().url("لینک معتبر").optional().or(z.literal("")),
});

type Values = z.infer<typeof schema>;

export function ProfileForm() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
      bio: "",
      avatar: "",
    },
  });

  useEffect(() => {
    if (user) {
      methods.reset({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        mobile: user.mobile ?? "",
        bio: user.bio ?? "",
        avatar: user.avatar ?? "",
      });
    }
  }, [user, methods]);

  const onSubmit = methods.handleSubmit(async (values) => {
    if (!user) return;
    try {
      const clean = (v?: string) => (v && v.length > 0 ? v : undefined);
      const updated = await usersService.update(user.id, {
        firstName: clean(values.firstName),
        lastName: clean(values.lastName),
        email: clean(values.email),
        mobile: clean(values.mobile),
        bio: clean(values.bio),
        avatar: clean(values.avatar),
      });
      setUser({ ...user, ...updated });
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
            <FormInput<Values> name="firstName" label="نام" />
            <FormInput<Values> name="lastName" label="نام خانوادگی" />
            <FormInput<Values> name="email" label="ایمیل" type="email" dir="ltr" />
            <FormInput<Values> name="mobile" label="موبایل" dir="ltr" placeholder="09xxxxxxxxx" />
            <FormInput<Values> name="avatar" label="آدرس آواتار" dir="ltr" className="sm:col-span-2" />
            <FormTextarea<Values>
              name="bio"
              label="بیوگرافی"
              rows={3}
              className="sm:col-span-2"
            />
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
