"use client";

import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, BadgeCheck, X } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { doctorsService } from "@/services/doctors.service";
import { parseApiError } from "@/lib/api-error";
import { formatDate, formatNumber, toPersianDigits } from "@/lib/format";
import { displayName, userInitials } from "@/lib/user";
import type { Doctor } from "@/types";

export default function DoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    doctorsService
      .get(id)
      .then(setDoctor)
      .catch((e) => toast.error(parseApiError(e).message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  return (
    <>
      <PageHeader
        title="پروفایل پزشک"
        description="بررسی مدارک، تایید یا رد درخواست پزشک."
        actions={
          <Button variant="outline" asChild>
            <Link href="/doctors">
              <ArrowRight />
              بازگشت
            </Link>
          </Button>
        }
      />

      {loading || !doctor ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14">
                    {doctor.user?.avatar ? (
                      <AvatarImage src={doctor.user.avatar} alt={displayName(doctor.user)} />
                    ) : null}
                    <AvatarFallback>{userInitials(doctor.user)}</AvatarFallback>
                  </Avatar>
                  <div className="leading-tight">
                    <CardTitle className="text-lg">{displayName(doctor.user)}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {doctor.specialty} · کد نظام {toPersianDigits(doctor.medicalCode)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={doctor.verificationStatus} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {doctor.biography ? (
                <p className="leading-7 text-foreground/90">{doctor.biography}</p>
              ) : null}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Info label="استان" value={doctor.province ?? "—"} />
                <Info label="شهر" value={doctor.city ?? "—"} />
                <Info
                  label="سابقه (سال)"
                  value={toPersianDigits(doctor.experienceYears)}
                />
                <Info
                  label="کلینیک"
                  value={doctor.clinicName ?? "—"}
                />
                <Info
                  label="تاریخ تایید"
                  value={doctor.verifiedAt ? formatDate(doctor.verifiedAt) : "—"}
                />
                <Info label="تعداد پاسخ" value={formatNumber(doctor.answerCount)} />
                <Info
                  label="پاسخ‌های پذیرفته"
                  value={formatNumber(doctor.acceptedAnswerCount)}
                />
                <Info
                  label="مقالات تایید شده"
                  value={formatNumber(doctor.approvedArticleCount)}
                />
                <Info
                  label="امتیاز رتبه"
                  value={toPersianDigits(doctor.rankScore.toFixed(0))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>شبکه‌ها و لینک‌ها</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {doctor.website ? <LinkRow label="وبسایت" value={doctor.website} /> : null}
              {doctor.instagram ? (
                <LinkRow label="اینستاگرام" value={`https://instagram.com/${doctor.instagram}`} />
              ) : null}
              {doctor.linkedin ? <LinkRow label="لینکدین" value={doctor.linkedin} /> : null}
              {!doctor.website && !doctor.instagram && !doctor.linkedin ? (
                <p className="text-xs text-muted-foreground">لینکی ثبت نشده است.</p>
              ) : null}
            </CardContent>
          </Card>

          <div className="lg:col-span-3 flex flex-wrap justify-end gap-2">
            <PermissionGuard permission="doctors.verify">
              {doctor.verificationStatus !== "rejected" ? (
                <ConfirmDialog
                  title="رد درخواست پزشک"
                  description="پس از رد، پزشک در فهرست رد شده‌ها قرار می‌گیرد."
                  destructive
                  confirmLabel="رد درخواست"
                  onConfirm={async () => {
                    try {
                      await doctorsService.verify(doctor.id, "rejected");
                      load();
                      toast.success("درخواست رد شد");
                    } catch (e) {
                      toast.error(parseApiError(e).message);
                    }
                  }}
                  trigger={
                    <Button variant="outline">
                      <X />
                      رد درخواست
                    </Button>
                  }
                />
              ) : null}
            </PermissionGuard>
            <PermissionGuard permission="doctors.verify">
              {doctor.verificationStatus !== "approved" ? (
                <ConfirmDialog
                  title="تایید پزشک"
                  description="پس از تایید، فعالیت پزشک در پلتفرم آغاز می‌شود."
                  confirmLabel="تایید پزشک"
                  onConfirm={async () => {
                    try {
                      await doctorsService.verify(doctor.id, "approved");
                      load();
                      toast.success("پزشک تایید شد");
                    } catch (e) {
                      toast.error(parseApiError(e).message);
                    }
                  }}
                  trigger={
                    <Button>
                      <BadgeCheck />
                      تایید پزشک
                    </Button>
                  }
                />
              ) : null}
            </PermissionGuard>
          </div>
        </div>
      )}
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

function LinkRow({ label, value }: { label: string; value: string }) {
  return (
    <a
      href={value}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted/40"
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate" dir="ltr">
        {value}
      </span>
    </a>
  );
}
