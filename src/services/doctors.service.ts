import { apiDelete, apiGet, apiList, apiPatch, apiPost } from "@/lib/axios";
import type {
  Doctor,
  DoctorClinic,
  DoctorClinicKind,
  DoctorVerificationStatus,
} from "@/types";

export type DoctorsQuery = {
  page?: number;
  limit?: number;
  q?: string;
  specialty?: string;
  city?: string;
  verificationStatus?: DoctorVerificationStatus;
  sortBy?: "rankScore" | "createdAt" | "experienceYears" | "ratingAverage";
  sortOrder?: "ASC" | "DESC";
};

export type CreateDoctorPayload = {
  userId: number;
  medicalCode: string;
  specialty: string;
  subSpecialty?: string;
  clinicName?: string;
  clinicAddress?: string;
  city?: string;
  province?: string;
  education?: string;
  experienceYears?: number;
  biography?: string;
  website?: string;
  instagram?: string;
  linkedin?: string;
  avatar?: string;
  heroImage?: string;
};

export type UpdateDoctorProfilePayload = Partial<
  Omit<CreateDoctorPayload, "userId">
>;

export type DoctorClinicPayload = {
  name: string;
  kind?: DoctorClinicKind;
  address?: string;
  city?: string;
  province?: string;
  phone?: string;
  email?: string;
  latitude?: string;
  longitude?: string;
  workingHours?: string;
  description?: string;
  image?: string;
  gallery?: string[];
  sortOrder?: number;
};

export const doctorsService = {
  list(params: DoctorsQuery = {}) {
    return apiList<Doctor>("/doctors", params);
  },
  get(id: string) {
    return apiGet<Doctor>(`/doctors/${id}`);
  },
  leaderboard(limit = 50) {
    return apiGet<Doctor[]>("/doctors/leaderboard", { limit });
  },
  verify(id: string, status: "approved" | "rejected", reason?: string) {
    return apiPost<Doctor>(`/doctors/${id}/verify`, { status, reason });
  },
  /**
   * Admin: create a doctor profile for an existing user. The user's `userType`
   * is bumped to `doctor` and the `doctor` role is attached automatically.
   */
  create(payload: CreateDoctorPayload) {
    return apiPost<Doctor>("/doctors", payload);
  },

  /** Admin: patch any doctor profile by its id (avatar, hero image, etc.). */
  update(id: string | number, payload: UpdateDoctorProfilePayload) {
    return apiPatch<Doctor>(`/doctors/${id}`, payload);
  },

  /* ------------------------ Clinic CRUD ------------------------ */

  listClinics(doctorId: string | number) {
    return apiGet<DoctorClinic[]>(`/doctors/${doctorId}/clinics`);
  },
  createClinic(doctorId: string | number, payload: DoctorClinicPayload) {
    return apiPost<DoctorClinic>(`/doctors/${doctorId}/clinics`, payload);
  },
  updateClinic(
    doctorId: string | number,
    clinicId: string | number,
    payload: Partial<DoctorClinicPayload>,
  ) {
    return apiPatch<DoctorClinic>(
      `/doctors/${doctorId}/clinics/${clinicId}`,
      payload,
    );
  },
  deleteClinic(doctorId: string | number, clinicId: string | number) {
    return apiDelete<void>(`/doctors/${doctorId}/clinics/${clinicId}`);
  },
};
