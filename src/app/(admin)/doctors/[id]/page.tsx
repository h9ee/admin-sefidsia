"use client";

import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, BadgeCheck, FileText, X } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { doctorsService } from "@/services/doctors.service";
import { parseApiError } from "@/lib/api-error";
import { formatDate, formatNumber, toPersianDigits } from "@/lib/format";
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
                    {doctor.avatar ? <AvatarImage src={doctor.avatar} alt={doctor.fullName} /> : null}
                    <AvatarFallback>{doctor.fullName.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div className="leading-tight">
                    <CardTitle className="text-lg">{doctor.fullName}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {doctor.specialty} · کد نظام {toPersianDigits(doctor.medicalNumber)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={doctor.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {doctor.bio ? <p className="leading-7 text-foreground/90">{doctor.bio}</p> : null}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Info label="شهر" value={doctor.city ?? "—"} />
                <Info
                  label="سابقه (سال)"
                  value={doctor.yearsOfExperience != null ? toPersianDigits(doctor.yearsOfExperience) : "—"}
                />
                <Info
                  label="تاریخ تایید"
                  value={doctor.verifiedAt ? formatDate(doctor.verifiedAt) : "—"}
                />
                <Info label="تعداد پاسخ" value={formatNumber(doctor.answersCount ?? 0)} />
                <Info label="تعداد مقاله" value={formatNumber(doctor.articlesCount ?? 0)} />
                <Info label="رتبه" value={doctor.rank ? toPersianDigits(doctor.rank) : "—"} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>مدارک</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {doctor.documents?.length ? (
                doctor.documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-muted/40"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{doc.name}</span>
                    <Badge variant="outline">PDF</Badge>
                  </a>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">مدرکی بارگذاری نشده است.</p>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-3 flex flex-wrap justify-end gap-2">
            <PermissionGuard permission="doctors.reject">
              {doctor.status !== "rejected" ? (
                <ConfirmDialog
                  title="رد درخواست پزشک"
                  description="پس از رد، پزشک در فهرست رد شده‌ها قرار می‌گیرد."
                  destructive
                  confirmLabel="رد درخواست"
                  onConfirm={async () => {
                    try {
                      await doctorsService.reject(doctor.id);
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
              {doctor.status !== "verified" ? (
                <ConfirmDialog
                  title="تایید پزشک"
                  description="پس از تایید، فعالیت پزشک در پلتفرم آغاز می‌شود."
                  confirmLabel="تایید پزشک"
                  onConfirm={async () => {
                    try {
                      await doctorsService.verify(doctor.id);
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
