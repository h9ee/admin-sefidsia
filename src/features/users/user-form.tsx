"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormInput } from "@/components/forms/form-input";
import { FormMultiSelect } from "@/components/forms/form-multi-select";
import { FormSwitch } from "@/components/forms/form-switch";
import { usersService } from "@/services/users.service";
import { rolesService } from "@/services/roles.service";
import { parseApiError } from "@/lib/api-error";

const schema = z.object({
  fullName: z.string().min(2, "نام را وارد کنید"),
  email: z.string().email("ایمیل معتبر نیست"),
  phone: z.string().optional(),
  password: z.string().optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  roles: z.array(z.string()),
});

type Values = z.infer<typeof schema>;

export function UserForm({ id }: { id?: string }) {
  const isEdit = !!id;
  const router = useRouter();
  const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([]);
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      isActive: true,
      isVerified: false,
      roles: [],
    },
  });

  useEffect(() => {
    rolesService
      .list()
      .then((res) => setRoleOptions(res.data.map((r) => ({ label: r.name, value: r.id }))))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!id) return;
    usersService
      .get(id)
      .then((u) =>
        methods.reset({
          fullName: u.fullName,
          email: u.email,
          phone: u.phone ?? "",
          password: "",
          isActive: u.isActive,
          isVerified: u.isVerified,
          roles: u.roles.map((r) => r.id),
        }),
      )
      .catch((e) => toast.error(parseApiError(e).message));
  }, [id, methods]);

  const onSubmit = methods.handleSubmit(async (values) => {
    try {
      const payload = { ...values, password: values.password || undefined };
      if (isEdit) {
        await usersService.update(id!, payload);
        toast.success("کاربر بروزرسانی شد");
      } else {
        if (!values.password) {
          methods.setError("password", { message: "رمز عبور الزامی است" });
          return;
        }
        await usersService.create({ ...payload, password: values.password! });
        toast.success("کاربر ایجاد شد");
      }
      router.push("/users");
    } catch (e) {
      toast.error(parseApiError(e).message);
    }
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات شخصی</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <FormInput<Values> name="fullName" label="نام و نام خانوادگی" required />
              <FormInput<Values> name="email" label="ایمیل" type="email" dir="ltr" required />
              <FormInput<Values> name="phone" label="موبایل" dir="ltr" />
              <FormInput<Values>
                name="password"
                label={isEdit ? "رمز عبور جدید (اختیاری)" : "رمز عبور"}
                type="password"
                dir="ltr"
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>دسترسی و نقش</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <FormMultiSelect<Values>
                  name="roles"
                  label="نقش‌ها"
                  options={roleOptions}
                  placeholder="نقش‌ها را انتخاب کنید"
                />
              </CardContent>
            </Card>

            <FormSwitch<Values>
              name="isActive"
              label="حساب فعال"
              description="کاربر غیرفعال نمی‌تواند وارد سامانه شود."
            />
            <FormSwitch<Values>
              name="isVerified"
              label="تایید شده"
              description="کاربران تایید شده می‌توانند برخی امکانات ویژه را ببینند."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            انصراف
          </Button>
          <Button type="submit" disabled={methods.formState.isSubmitting}>
            <Save />
            {isEdit ? "ذخیره تغییرات" : "ایجاد کاربر"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
