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
import { FormTextarea } from "@/components/forms/form-textarea";
import { usersService } from "@/services/users.service";
import { rolesService } from "@/services/roles.service";
import { parseApiError } from "@/lib/api-error";

// Each user carries exactly one role at the UI level. We still call the
// multi-role backend (POST / DELETE `/users/:id/roles`) under the hood —
// flipping role = remove old + add new. NO_ROLE is the sentinel for
// "هیچ نقشی" (radix Select forbids "" as an item value).
const NO_ROLE = "__none__";

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
  // `userType` is intentionally NOT a form field — the backend derives it
  // from the assigned role slug on every `assignRole` call. Letting an
  // admin pick it manually let the two go out of sync (e.g. role=doctor
  // + userType=normal → frontend treats user as normal).
  roleId: z.string(),
});

type Values = z.infer<typeof schema>;

export function UserForm({ id }: { id: string }) {
  const router = useRouter();
  const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([]);
  const [currentRoles, setCurrentRoles] = useState<string[]>([]);
  // True when the loaded user already has >1 role from before single-role
  // enforcement landed. We show a warning so the operator knows submitting
  // will collapse them down to the picked one.
  const [hadMultipleRoles, setHadMultipleRoles] = useState(false);

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
      roleId: NO_ROLE,
    },
  });

  useEffect(() => {
    rolesService
      .list()
      .then((roles) =>
        setRoleOptions([
          { label: "بدون نقش", value: NO_ROLE },
          // Radix Select compares item.value against the controlled `value`
          // as a STRING (`item.value === currentValue` after internal
          // coercion). The backend now returns numeric ids (post UUID→INT
          // migration) — passing them as numbers makes the trigger render
          // empty even when a value is "selected". Force-string here AND
          // where we seed the form, so both sides agree on the type.
          ...roles.map((r) => ({ label: r.name, value: String(r.id) })),
        ]),
      )
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!id) return;
    usersService
      .get(id)
      .then((u) => {
        // Backend now returns numeric ids; the dropdown's Radix Select
        // does a strict string compare, so we normalise to string here
        // (matches `roleOptions` where we do the same).
        const roles = u.roles?.map((r) => String(r.id)) ?? [];
        setCurrentRoles(roles);
        setHadMultipleRoles(roles.length > 1);
        methods.reset({
          firstName: u.firstName ?? "",
          lastName: u.lastName ?? "",
          email: u.email ?? "",
          mobile: u.mobile ?? "",
          bio: u.bio ?? "",
          avatar: u.avatar ?? "",
          status: u.status,
          roleId: roles[0] ?? NO_ROLE,
        });
      })
      .catch((e) => toast.error(parseApiError(e).message));
  }, [id, methods]);

  const onSubmit = methods.handleSubmit(async (values) => {
    try {
      // Nullable text fields (backend `nullableText`): empty must be sent as
      // `null` so the column is actually cleared. Sending `undefined` drops
      // the field from the JSON body, and the backend's partial-PATCH logic
      // treats "missing" as "no change" — making the clear a silent no-op.
      const nullable = (v?: string) => (v && v.length > 0 ? v : null);
      // `email`/`mobile` are `.optional()` in the backend (not nullable) —
      // leave them out when empty so validation doesn't reject a null.
      const optional = (v?: string) => (v && v.length > 0 ? v : undefined);
      // `userType` is deliberately not sent — the backend's `assignRole`
      // syncs it from the role slug, so passing both lets the two diverge.
      await usersService.update(id, {
        firstName: nullable(values.firstName),
        lastName: nullable(values.lastName),
        bio: nullable(values.bio),
        avatar: nullable(values.avatar),
        email: optional(values.email),
        mobile: optional(values.mobile),
        status: values.status,
      });
      // Collapse the UI's single-role selection into a 0- or 1-element list
      // and let `setRoles` diff it against whatever the user currently has.
      // The diff will drop any leftover multi-role rows in one go.
      const nextRoles = values.roleId === NO_ROLE ? [] : [values.roleId];
      await usersService.setRoles(id, currentRoles, nextRoles);
      setCurrentRoles(nextRoles);
      setHadMultipleRoles(false);
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
                  name="roleId"
                  label="نقش کاربر"
                  options={roleOptions}
                  placeholder="یک نقش انتخاب کنید"
                  hint={
                    hadMultipleRoles
                      ? "این کاربر چند نقش داشت؛ با ذخیره، فقط نقش انتخاب‌شده باقی می‌ماند."
                      : "نقش هر کاربر منحصربه‌فرد است. تغییر نقش، نقش قبلی را جایگزین می‌کند."
                  }
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
