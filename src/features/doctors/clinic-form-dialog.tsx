"use client";

import * as React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormInput, FormSelect, FormTextarea } from "@/components/forms";
import { MediaField } from "@/features/media";
import { ClinicGalleryField } from "./clinic-gallery-field";
import { doctorsService, type DoctorClinicPayload } from "@/services/doctors.service";
import { parseApiError } from "@/lib/api-error";
import type { DoctorClinic } from "@/types";

const schema = z.object({
  name: z.string().min(2, "نام محل فعالیت الزامی است").max(160),
  kind: z.enum(["clinic", "hospital", "office"]),
  address: z.string().max(500).optional().or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
  province: z.string().max(80).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  email: z.string().email("ایمیل معتبر وارد کنید").max(160).optional().or(z.literal("")),
  latitude: z.string().max(32).optional().or(z.literal("")),
  longitude: z.string().max(32).optional().or(z.literal("")),
  workingHours: z.string().max(500).optional().or(z.literal("")),
  description: z.string().max(5000).optional().or(z.literal("")),
  image: z.string().nullable().optional(),
  gallery: z.array(z.string()).max(24, "حداکثر ۲۴ تصویر").optional(),
  sortOrder: z
    .string()
    .regex(/^\d*$/, "فقط عدد")
    .optional()
    .or(z.literal("")),
});

type Values = z.input<typeof schema>;

const KIND_OPTIONS = [
  { label: "مطب / کلینیک", value: "clinic" },
  { label: "بیمارستان", value: "hospital" },
  { label: "دفتر کاری", value: "office" },
];

/**
 * Add/edit dialog for a single DoctorClinic. Submits to either the
 * "create" or "update" admin endpoint depending on whether `clinic` is
 * provided. On success the parent re-fetches the list (via `onSaved`).
 */
export function ClinicFormDialog({
  open,
  onOpenChange,
  doctorId,
  clinic,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorId: string | number;
  clinic?: DoctorClinic;
  onSaved: () => void;
}) {
  const isEdit = Boolean(clinic);

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(clinic),
  });

  // Reset when the target clinic changes (e.g. open dialog for another row).
  React.useEffect(() => {
    if (open) methods.reset(buildDefaults(clinic));
  }, [open, clinic, methods]);

  const onSubmit = methods.handleSubmit(async (values) => {
    const payload = toPayload(values);
    try {
      if (isEdit && clinic) {
        await doctorsService.updateClinic(doctorId, clinic.id, payload);
        toast.success("محل فعالیت به‌روز شد");
      } else {
        await doctorsService.createClinic(doctorId, payload);
        toast.success("محل فعالیت اضافه شد");
      }
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error(parseApiError(e).message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "ویرایش محل فعالیت" : "افزودن محل فعالیت"}
          </DialogTitle>
          <DialogDescription>
            مشخصات مطب، بیمارستان یا دفتر کاری پزشک را وارد کنید. می‌توانید
            یک تصویر شاخص و گالری چندعکسه نیز اضافه کنید.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput<Values>
                name="name"
                label="نام محل فعالیت"
                required
                placeholder="مثلا: کلینیک پارس"
              />
              <FormSelect<Values>
                name="kind"
                label="نوع"
                options={KIND_OPTIONS}
              />
              <FormInput<Values> name="province" label="استان" />
              <FormInput<Values> name="city" label="شهر" />
              <FormInput<Values>
                name="phone"
                label="تلفن"
                dir="ltr"
                placeholder="021-12345678"
              />
              <FormInput<Values>
                name="email"
                label="ایمیل"
                dir="ltr"
                placeholder="clinic@example.com"
              />
              <FormInput<Values>
                name="latitude"
                label="عرض جغرافیایی"
                dir="ltr"
              />
              <FormInput<Values>
                name="longitude"
                label="طول جغرافیایی"
                dir="ltr"
              />
            </div>

            <FormInput<Values>
              name="workingHours"
              label="ساعات کاری"
              placeholder="شنبه تا چهارشنبه ۱۰ تا ۱۸"
            />
            <FormTextarea<Values>
              name="address"
              label="نشانی"
              rows={2}
            />
            <FormTextarea<Values>
              name="description"
              label="توضیحات"
              rows={3}
            />

            <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
              <MediaField<Values>
                name="image"
                label="تصویر شاخص"
                kind="image"
                hint="در بالای کارت محل فعالیت نمایش داده می‌شود."
                previewClassName="h-24 w-32"
              />
              <ClinicGalleryField<Values>
                name="gallery"
                label="گالری تصاویر"
                hint="حداکثر ۲۴ تصویر — در صفحه عمومی به‌صورت لایت‌باکس باز می‌شود."
              />
            </div>

            <FormInput<Values>
              name="sortOrder"
              label="ترتیب نمایش"
              type="number"
              min={0}
              hint="عدد کوچک‌تر، بالاتر نمایش داده می‌شود."
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={methods.formState.isSubmitting}>
                <Save />
                {isEdit ? "ذخیره تغییرات" : "افزودن محل فعالیت"}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */

function buildDefaults(c?: DoctorClinic): Values {
  return {
    name: c?.name ?? "",
    kind: c?.kind ?? "clinic",
    address: c?.address ?? "",
    city: c?.city ?? "",
    province: c?.province ?? "",
    phone: c?.phone ?? "",
    email: c?.email ?? "",
    latitude: c?.latitude ?? "",
    longitude: c?.longitude ?? "",
    workingHours: c?.workingHours ?? "",
    description: c?.description ?? "",
    image: c?.image ?? null,
    gallery: c?.gallery ?? [],
    sortOrder: c?.sortOrder != null ? String(c.sortOrder) : "",
  };
}

function toPayload(values: Values): DoctorClinicPayload {
  const payload: DoctorClinicPayload = {
    name: values.name,
    kind: values.kind,
  };
  // Strip empty strings — backend's optional fields tolerate `undefined`
  // but choke on the empty-string url/email regexes.
  const optional = [
    "address",
    "city",
    "province",
    "phone",
    "email",
    "latitude",
    "longitude",
    "workingHours",
    "description",
  ] as const;
  for (const k of optional) {
    const raw = values[k];
    if (raw && raw.length > 0) (payload as Record<string, unknown>)[k] = raw;
  }
  if (values.image) payload.image = values.image;
  if (values.gallery && values.gallery.length > 0) payload.gallery = values.gallery;
  if (values.sortOrder && values.sortOrder.length > 0) {
    payload.sortOrder = Number(values.sortOrder);
  }
  return payload;
}
