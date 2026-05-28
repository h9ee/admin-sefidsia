"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Building2,
  Hospital,
  ImageOff,
  MapPin,
  Pencil,
  Plus,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { doctorsService } from "@/services/doctors.service";
import { parseApiError } from "@/lib/api-error";
import { mediaUrl } from "@/lib/media-url";
import type { DoctorClinic } from "@/types";
import { ClinicFormDialog } from "./clinic-form-dialog";

/**
 * Card that lists a doctor's practice locations and lets admins add /
 * edit / delete them. Each row shows the clinic image, name, address,
 * and gallery count; opens the editor dialog on edit.
 */
export function DoctorClinicsCard({ doctorId }: { doctorId: string | number }) {
  const [clinics, setClinics] = React.useState<DoctorClinic[] | null>(null);
  const [editing, setEditing] = React.useState<DoctorClinic | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setClinics(await doctorsService.listClinics(doctorId));
    } catch (e) {
      toast.error(parseApiError(e).message);
      setClinics([]);
    }
  }, [doctorId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  function startAdd() {
    setEditing(undefined);
    setDialogOpen(true);
  }
  function startEdit(c: DoctorClinic) {
    setEditing(c);
    setDialogOpen(true);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>محل‌های فعالیت</CardTitle>
            <CardDescription>
              مطب، بیمارستان یا دفاتر کاری پزشک. هر مورد می‌تواند تصویر شاخص
              و گالری مستقل داشته باشد.
            </CardDescription>
          </div>
          <Button size="sm" onClick={startAdd}>
            <Plus />
            افزودن
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {clinics === null ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : clinics.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-card/60 p-4 text-center text-sm text-muted-foreground">
            هنوز محل فعالیتی برای این پزشک ثبت نشده است.
          </p>
        ) : (
          <ul className="space-y-3">
            {clinics.map((c) => (
              <ClinicRow
                key={c.id}
                clinic={c}
                onEdit={() => startEdit(c)}
                onDeleted={load}
                doctorId={doctorId}
              />
            ))}
          </ul>
        )}
      </CardContent>

      <ClinicFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        doctorId={doctorId}
        clinic={editing}
        onSaved={() => {
          void load();
        }}
      />
    </Card>
  );
}

function ClinicRow({
  clinic,
  doctorId,
  onEdit,
  onDeleted,
}: {
  clinic: DoctorClinic;
  doctorId: string | number;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const KindIcon =
    clinic.kind === "hospital"
      ? Hospital
      : clinic.kind === "office"
        ? Stethoscope
        : Building2;

  return (
    <li className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
      <div className="size-16 shrink-0 overflow-hidden rounded-md bg-muted">
        {clinic.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(clinic.image)}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-5" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="inline-flex items-center gap-1.5 font-medium">
          <KindIcon className="size-3.5 text-muted-foreground" />
          {clinic.name}
        </div>
        {(clinic.city || clinic.address) && (
          <p className="mt-0.5 inline-flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 size-3" />
            <span className="truncate">
              {[clinic.city, clinic.address].filter(Boolean).join(" — ")}
            </span>
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {clinic.gallery?.length ?? 0} تصویر در گالری
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Pencil />
          ویرایش
        </Button>
        <ConfirmDialog
          title="حذف محل فعالیت"
          description={`«${clinic.name}» حذف خواهد شد. این عمل قابل بازگشت نیست.`}
          destructive
          confirmLabel="حذف"
          onConfirm={async () => {
            try {
              await doctorsService.deleteClinic(doctorId, clinic.id);
              toast.success("محل فعالیت حذف شد");
              onDeleted();
            } catch (e) {
              toast.error(parseApiError(e).message);
            }
          }}
          trigger={
            <Button size="sm" variant="ghost" aria-label="حذف">
              <Trash2 className="text-destructive" />
            </Button>
          }
        />
      </div>
    </li>
  );
}
