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
import { FormSelect } from "@/components/forms/form-select";
import { FormMultiSelect } from "@/components/forms/form-multi-select";
import { FormTextarea } from "@/components/forms/form-textarea";
import { usersService } from "@/services/users.service";
import { rolesService } from "@/services/roles.service";
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
  avatar: z.string().url("لینک آواتار معتبر نیست").optional().or(z.literal("")),
  status: z.enum(["active", "blocked", "pending"]),
  userType: z.enum(["normal", "doctor", "admin"]),
  roles: z.array(z.string()),
});

type Values = z.infer<typeof schema>;

export function UserForm({ id }: { id: string }) {
  const router = useRouter();
  const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([]);
  const [currentRoles, setCurrentRoles] = useState<string[]>([]);

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
      bio: "",
      avatar: "",
      status: "active",
      userType: "normal",
      roles: [],
    },
  });

  useEffect(() => {
    rolesService
      .list()
      .then((roles) =>
        setRoleOptions(roles.map((r) => ({ label: r.name, value: r.id }))),
      )
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!id) return;
    usersService
      .get(id)
      .then((u) => {
        const roles = u.roles?.map((r) => r.id) ?? [];
        setCurrentRoles(roles);
        methods.reset({
          firstName: u.firstName ?? "",
          lastName: u.lastName ?? "",
          email: u.email ?? "",
          mobile: u.mobile ?? "",
          bio: u.bio ?? "",
          avatar: u.avatar ?? "",
          status: u.status,
          userType: u.userType,
          roles,
        });
      })
      .catch((e) => toast.error(parseApiError(e).message));
  }, [id, methods]);

  const onSubmit = methods.handleSubmit(async (values) => {
    try {
      const cleanString = (v?: string) => (v && v.length > 0 ? v : undefined);
      await usersService.update(id, {
        firstName: cleanString(values.firstName),
        lastName: cleanString(values.lastName),
        email: cleanString(values.email),
        mobile: cleanString(values.mobile),
        bio: cleanString(values.bio),
        avatar: cleanString(values.avatar),
        status: values.status,
        userType: values.userType,
      });
      await usersService.setRoles(id, currentRoles, values.roles);
      setCurrentRoles(values.roles);
      toast.success("کاربر بروزرسانی شد");
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
              <div className="grid grid-cols-2 gap-3">
                <FormInput<Values> name="firstName" label="نام" />
                <FormInput<Values> name="lastName" label="نام خانوادگی" />
              </div>
              <FormInput<Values> name="email" label="ایمیل" type="email" dir="ltr" />
              <FormInput<Values> name="mobile" label="موبایل" dir="ltr" placeholder="09xxxxxxxxx" />
              <FormInput<Values> name="avatar" label="آدرس آواتار" dir="ltr" />
              <FormTextarea<Values> name="bio" label="بیوگرافی" rows={3} />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>دسترسی و نقش</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <FormSelect<Values>
                  name="status"
                  label="وضعیت"
                  options={[
                    { label: "فعال", value: "active" },
                    { label: "در انتظار", value: "pending" },
                    { label: "مسدود", value: "blocked" },
                  ]}
                />
                <FormSelect<Values>
                  name="userType"
                  label="نوع کاربر"
                  options={[
                    { label: "عادی", value: "normal" },
                    { label: "پزشک", value: "doctor" },
                    { label: "ادمین", value: "admin" },
                  ]}
                />
                <FormMultiSelect<Values>
                  name="roles"
                  label="نقش‌ها"
                  options={roleOptions}
                  placeholder="نقش‌ها را انتخاب کنید"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            انصراف
          </Button>
          <Button type="submit" disabled={methods.formState.isSubmitting}>
            <Save />
            ذخیره تغییرات
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
