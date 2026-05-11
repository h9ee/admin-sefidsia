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
import { rolesService } from "@/services/roles.service";
import { defaultPermissionGroups } from "@/config/permissions";
import { parseApiError } from "@/lib/api-error";
import type { PermissionGroup } from "@/types";

const schema = z.object({
  name: z.string().min(2, "نام نقش الزامی است"),
  slug: z.string().min(2, "شناسه الزامی است"),
  description: z.string().optional(),
  permissions: z.array(z.string()),
});

type Values = z.infer<typeof schema>;

export function RoleForm({ id }: { id?: string }) {
  const isEdit = !!id;
  const router = useRouter();
  const [groups, setGroups] = useState<PermissionGroup[]>(defaultPermissionGroups);
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "", description: "", permissions: [] },
  });

  useEffect(() => {
    rolesService.permissionGroups().then(setGroups).catch(() => undefined);
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
          permissions: r.permissions,
        }),
      )
      .catch((e) => toast.error(parseApiError(e).message));
  }, [id, methods]);

  const selected = methods.watch("permissions") ?? [];

  const togglePermission = (key: string) => {
    methods.setValue(
      "permissions",
      selected.includes(key) ? selected.filter((p) => p !== key) : [...selected, key],
      { shouldDirty: true },
    );
  };

  const toggleGroup = (g: PermissionGroup) => {
    const keys = g.permissions.map((p) => p.key);
    const allOn = keys.every((k) => selected.includes(k));
    methods.setValue(
      "permissions",
      allOn ? selected.filter((p) => !keys.includes(p)) : Array.from(new Set([...selected, ...keys])),
      { shouldDirty: true },
    );
  };

  const onSubmit = methods.handleSubmit(async (values) => {
    try {
      if (isEdit) {
        await rolesService.update(id!, values);
        toast.success("نقش بروزرسانی شد");
      } else {
        await rolesService.create(values);
        toast.success("نقش ایجاد شد");
      }
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
            <FormTextarea<Values> name="description" label="توضیح" rows={2} className="sm:col-span-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>دسترسی‌ها</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {groups.map((g) => {
              const keys = g.permissions.map((p) => p.key);
              const allOn = keys.every((k) => selected.includes(k));
              const someOn = keys.some((k) => selected.includes(k));
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
                      {selected.filter((k) => keys.includes(k)).length} / {keys.length}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {g.permissions.map((p) => (
                      <label
                        key={p.key}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-xs hover:border-border"
                      >
                        <Checkbox
                          checked={selected.includes(p.key)}
                          onCheckedChange={() => togglePermission(p.key)}
                        />
                        <span className="flex-1">{p.label}</span>
                        <code className="text-[10px] text-muted-foreground" dir="ltr">
                          {p.key}
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
