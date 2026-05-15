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
import { Checkbox } from "@/components/ui/checkbox";
import { FormInput } from "@/components/forms/form-input";
import { FormTextarea } from "@/components/forms/form-textarea";
import { permissionsService, rolesService } from "@/services/roles.service";
import { groupPermissions, fallbackPermissionGroups } from "@/config/permissions";
import { parseApiError } from "@/lib/api-error";
import { slugify } from "@/lib/format";
import type { Permission, PermissionGroup } from "@/types";

const schema = z.object({
  name: z.string().min(2, "نام نقش الزامی است"),
  slug: z
    .string()
    .min(2, "شناسه الزامی است")
    .regex(/^[a-z0-9_-]+$/, "فقط حروف کوچک انگلیسی و _-"),
  description: z.string().optional().or(z.literal("")),
  permissionIds: z.array(z.string()),
});

type Values = z.infer<typeof schema>;

export function RoleForm({ id }: { id?: string }) {
  const isEdit = !!id;
  const router = useRouter();
  const [groups, setGroups] = useState<PermissionGroup[]>(fallbackPermissionGroups);

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "", description: "", permissionIds: [] },
  });

  useEffect(() => {
    permissionsService
      .list()
      .then((items) => setGroups(groupPermissions(items)))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!id) return;
    rolesService
      .get(id)
      .then((r) =>
        methods.reset({
          name: r.name,
          slug: r.slug,
          description: r.description ?? "",
          permissionIds: (r.permissions ?? []).map((p) => p.id),
        }),
      )
      .catch((e) => toast.error(parseApiError(e).message));
  }, [id, methods]);

  // Auto-slug for new roles
  const name = methods.watch("name");
  useEffect(() => {
    if (!isEdit && name) methods.setValue("slug", slugify(name));
  }, [name, isEdit, methods]);

  const selected = methods.watch("permissionIds") ?? [];

  const togglePermission = (permission: Permission) => {
    methods.setValue(
      "permissionIds",
      selected.includes(permission.id)
        ? selected.filter((p) => p !== permission.id)
        : [...selected, permission.id],
      { shouldDirty: true },
    );
  };

  const toggleGroup = (g: PermissionGroup) => {
    const ids = g.permissions.map((p) => p.id);
    const allOn = ids.every((k) => selected.includes(k));
    methods.setValue(
      "permissionIds",
      allOn ? selected.filter((p) => !ids.includes(p)) : Array.from(new Set([...selected, ...ids])),
      { shouldDirty: true },
    );
  };

  const onSubmit = methods.handleSubmit(async (values) => {
    try {
      const payload = {
        name: values.name,
        slug: values.slug,
        description: values.description || undefined,
      };
      const role = isEdit
        ? await rolesService.update(id!, payload)
        : await rolesService.create(payload);

      await rolesService.setPermissions(role.id, values.permissionIds);
      toast.success(isEdit ? "نقش بروزرسانی شد" : "نقش ایجاد شد");
      router.push("/roles");
    } catch (e) {
      toast.error(parseApiError(e).message);
    }
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات نقش</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <FormInput<Values> name="name" label="نام نقش" required />
            <FormInput<Values> name="slug" label="شناسه (slug)" required dir="ltr" />
            <FormTextarea<Values>
              name="description"
              label="توضیح"
              rows={2}
              className="sm:col-span-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>دسترسی‌ها</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {groups.map((g) => {
              const ids = g.permissions.map((p) => p.id);
              const allOn = ids.length > 0 && ids.every((k) => selected.includes(k));
              const someOn = ids.some((k) => selected.includes(k));
              return (
                <div key={g.key} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={allOn ? true : someOn ? "indeterminate" : false}
                        onCheckedChange={() => toggleGroup(g)}
                      />
                      <p className="text-sm font-medium">{g.label}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {selected.filter((k) => ids.includes(k)).length} / {ids.length}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {g.permissions.map((p) => (
                      <label
                        key={p.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-xs hover:border-border"
                      >
                        <Checkbox
                          checked={selected.includes(p.id)}
                          onCheckedChange={() => togglePermission(p)}
                        />
                        <span className="flex-1">{p.name}</span>
                        <code className="text-[10px] text-muted-foreground" dir="ltr">
                          {p.slug}
                        </code>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            انصراف
          </Button>
          <Button type="submit" disabled={methods.formState.isSubmitting}>
            <Save />
            {isEdit ? "ذخیره تغییرات" : "ایجاد نقش"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
