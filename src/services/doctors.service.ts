import { apiGet, apiList, apiPost } from "@/lib/axios";
import type { Doctor, DoctorVerificationStatus } from "@/types";

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
};
