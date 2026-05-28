"use client";

import * as React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MediaField } from "@/features/media";
import {
  doctorsService,
  type UpdateDoctorProfilePayload,
} from "@/services/doctors.service";
import { parseApiError } from "@/lib/api-error";
import type { Doctor } from "@/types";

type Values = {
  avatar: string | null;
  heroImage: string | null;
};

/**
 * Inline card for updating a doctor's `avatar` (personal head-shot) and
 * `heroImage` (wide cover for the public page). Calls `PATCH /doctors/:id`
 * with only the changed fields so admins can also approve/reject in
 * parallel without conflicts.
 */
export function DoctorImagesCard({
  doctor,
  onUpdated,
}: {
  doctor: Doctor;
  onUpdated?: (next: Doctor) => void;
}) {
  const methods = useForm<Values>({
    defaultValues: {
      avatar: doctor.avatar ?? null,
      heroImage: doctor.heroImage ?? null,
    },
  });

  // Re-seed when the doctor changes (parent re-fetches after verify, etc.).
  React.useEffect(() => {
    methods.reset({
      avatar: doctor.avatar ?? null,
      heroImage: doctor.heroImage ?? null,
    });
  }, [doctor.avatar, doctor.heroImage, methods]);

  const onSubmit = methods.handleSubmit(async (values) => {
    const payload: UpdateDoctorProfilePayload = {};
    if ((values.avatar ?? null) !== (doctor.avatar ?? null))
      payload.avatar = values.avatar ?? undefined;
    if ((values.heroImage ?? null) !== (doctor.heroImage ?? null))
      payload.heroImage = values.heroImage ?? undefined;
    if (Object.keys(payload).length === 0) {
      toast.info("تغییری برای ذخیره وجود ندارد.");
      return;
    }
    try {
      const next = await doctorsService.update(doctor.id, payload);
      toast.success("تصاویر پزشک به‌روز شد");
      onUpdated?.(next);
    } catch (e) {
      toast.error(parseApiError(e).message);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>تصاویر پزشک</CardTitle>
        <CardDescription>
          عکس پرسنلی و کاور صفحه پزشک. کاور بالای صفحه عمومی پزشک نمایش
          داده می‌شود و در پیش‌نمایش اشتراک‌گذاری شبکه‌های اجتماعی استفاده
          می‌شود.
        </CardDescription>
      </CardHeader>
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <MediaField<Values>
                name="avatar"
                label="عکس پرسنلی"
                hint="پیشنهاد: تصویر چهره، مربعی، حداقل ۴۰۰×۴۰۰."
                kind="image"
              />
              <MediaField<Values>
                name="heroImage"
                label="عکس کاور (هیرو)"
                hint="پیشنهاد: تصویر افقی، نسبت ۱۶:۹، حداقل ۱۶۰۰×۹۰۰."
                kind="image"
                previewClassName="h-24 w-40"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={methods.formState.isSubmitting}
              >
                <Save />
                ذخیره تصاویر
              </Button>
            </div>
          </CardContent>
        </form>
      </FormProvider>
    </Card>
  );
}
