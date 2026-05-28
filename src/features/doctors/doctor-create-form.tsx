"use client";

import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormInput,
  FormTextarea,
  FormUserSelect,
} from "@/components/forms";
import { MediaField } from "@/features/media";
import { doctorsService } from "@/services/doctors.service";
import { parseApiError } from "@/lib/api-error";

const schema = z.object({
  userId: z
    .number()
    .int()
    .positive({ message: "انتخاب کاربر الزامی است" }),
  medicalCode: z
    .string()
    .min(3, "کد نظام پزشکی حداقل ۳ کاراکتر")
    .max(50),
  specialty: z
    .string()
    .min(2, "تخصص الزامی است")
    .max(120),
  subSpecialty: z.string().max(120).optional().or(z.literal("")),
  experienceYears: z
    .string()
    .regex(/^\d*$/, "فقط عدد")
    .optional()
    .or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
  province: z.string().max(80).optional().or(z.literal("")),
  education: z.string().max(2000).optional().or(z.literal("")),
  biography: z.string().max(5000).optional().or(z.literal("")),
  website: z.string().url("لینک معتبر وارد کنید").optional().or(z.literal("")),
  instagram: z.string().max(120).optional().or(z.literal("")),
  linkedin: z.string().url("لینک معتبر").optional().or(z.literal("")),
  avatar: z.string().nullable().optional(),
  heroImage: z.string().nullable().optional(),
});

type Values = z.input<typeof schema>;

const FIELD_LABELS: Record<keyof Values, string> = {
  userId: "کاربر",
  medicalCode: "کد نظام پزشکی",
  specialty: "تخصص",
  subSpecialty: "فوق تخصص",
  experienceYears: "سال‌های سابقه",
  city: "شهر",
  province: "استان",
  education: "تحصیلات",
  biography: "بیوگرافی",
  website: "وب‌سایت",
  instagram: "اینستاگرام",
  linkedin: "لینکدین",
  avatar: "عکس پرسنلی",
  heroImage: "عکس کاور",
};

function firstErrorMessage(errors: unknown): string | undefined {
  if (!errors || typeof errors !== "object") return undefined;
  const obj = errors as Record<string, unknown>;
  if (typeof obj.message === "string" && obj.message) return obj.message;
  for (const key of Object.keys(obj)) {
    const found = firstErrorMessage(obj[key]);
    if (found) return found;
  }
  return undefined;
}

export function DoctorCreateForm() {
  const router = useRouter();
  const methods = useForm<Values>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      userId: undefined,
      medicalCode: "",
      specialty: "",
      subSpecialty: "",
      experienceYears: "",
      city: "",
      province: "",
      education: "",
      biography: "",
      website: "",
      instagram: "",
      linkedin: "",
      avatar: null,
      heroImage: null,
    },
  });

  const onSubmit = methods.handleSubmit(
    async (values) => {
      try {
        const clean = (v?: string) =>
          v && v.length > 0 ? v : undefined;

        const doctor = await doctorsService.create({
          userId: Number(values.userId),
          medicalCode: values.medicalCode,
          specialty: values.specialty,
          subSpecialty: clean(values.subSpecialty),
          experienceYears:
            values.experienceYears && values.experienceYears.length > 0
              ? Number(values.experienceYears)
              : undefined,
          city: clean(values.city),
          province: clean(values.province),
          education: clean(values.education),
          biography: clean(values.biography),
          website: clean(values.website),
          instagram: clean(values.instagram),
          linkedin: clean(values.linkedin),
          avatar: values.avatar ?? undefined,
          heroImage: values.heroImage ?? undefined,
        });
        toast.success("پزشک ایجاد شد");
        router.push(`/doctors/${doctor.id}`);
      } catch (e) {
        toast.error(parseApiError(e).message);
      }
    },
    (errors) => {
      const msg = firstErrorMessage(errors);
      toast.error(msg ?? "لطفاً خطاهای فرم را برطرف کنید.");
    },
  );

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>کاربر و اطلاعات حرفه‌ای</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormUserSelect<Values>
              name="userId"
              label={FIELD_LABELS.userId}
              required
              hint="فقط می‌توان برای کاربر موجود پروفایل پزشک ساخت. اگر کاربر هنوز ثبت‌نام نکرده، ابتدا با شماره موبایلش وارد شود."
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormInput<Values>
                name="medicalCode"
                label={FIELD_LABELS.medicalCode}
                required
                dir="ltr"
                placeholder="مثلاً ۱۲۳۴۵۶"
              />
              <FormInput<Values>
                name="experienceYears"
                label={FIELD_LABELS.experienceYears}
                type="number"
                min={0}
                max={80}
                dir="ltr"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormInput<Values>
                name="specialty"
                label={FIELD_LABELS.specialty}
                required
                placeholder="مثلاً قلب و عروق"
              />
              <FormInput<Values>
                name="subSpecialty"
                label={FIELD_LABELS.subSpecialty}
                placeholder="مثلاً اینترونشن"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>موقعیت اصلی</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormInput<Values> name="province" label={FIELD_LABELS.province} />
              <FormInput<Values> name="city" label={FIELD_LABELS.city} />
            </div>
            <p className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              محل‌های فعالیت (مطب، بیمارستان، …) و گالری هر کدام را پس از
              ایجاد پزشک، از صفحه «جزئیات پزشک ← محل‌های فعالیت» اضافه کنید.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تصاویر</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <MediaField<Values>
              name="avatar"
              label={FIELD_LABELS.avatar}
              hint="پیشنهاد: چهره، مربعی، حداقل ۴۰۰×۴۰۰."
              kind="image"
            />
            <MediaField<Values>
              name="heroImage"
              label={FIELD_LABELS.heroImage}
              hint="پیشنهاد: افقی، نسبت ۱۶:۹، حداقل ۱۶۰۰×۹۰۰."
              kind="image"
              previewClassName="h-24 w-40"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>سوابق و بیوگرافی</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormTextarea<Values>
              name="education"
              label={FIELD_LABELS.education}
              rows={3}
              hint="مدرک، دانشگاه، سال‌ها — به‌صورت متن آزاد."
            />
            <FormTextarea<Values>
              name="biography"
              label={FIELD_LABELS.biography}
              rows={5}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>شبکه‌ها</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FormInput<Values>
              name="website"
              label={FIELD_LABELS.website}
              dir="ltr"
              placeholder="https://"
            />
            <FormInput<Values>
              name="instagram"
              label={FIELD_LABELS.instagram}
              dir="ltr"
              placeholder="username"
            />
            <FormInput<Values>
              name="linkedin"
              label={FIELD_LABELS.linkedin}
              dir="ltr"
              placeholder="https://linkedin.com/in/…"
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            انصراف
          </Button>
          <Button type="submit" disabled={methods.formState.isSubmitting}>
            <Save />
            ایجاد پزشک
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
