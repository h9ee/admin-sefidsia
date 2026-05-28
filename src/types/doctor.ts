import type { User } from "./auth";

export type DoctorVerificationStatus = "pending" | "approved" | "rejected";

export type DoctorClinicKind = "clinic" | "hospital" | "office";

export type DoctorClinic = {
  id: number;
  doctorId: number;
  name: string;
  kind: DoctorClinicKind;
  address: string | null;
  city: string | null;
  province: string | null;
  phone: string | null;
  email: string | null;
  latitude: string | null;
  longitude: string | null;
  workingHours: string | null;
  description: string | null;
  image: string | null;
  gallery: string[] | null;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Doctor = {
  id: string;
  userId: string;
  medicalCode: string;
  specialty: string;
  subSpecialty: string | null;
  /** Deprecated — superseded by the `clinics` join table; kept for legacy data. */
  clinicName: string | null;
  clinicAddress: string | null;
  city: string | null;
  province: string | null;
  education: string | null;
  experienceYears: number;
  biography: string | null;
  website: string | null;
  instagram: string | null;
  linkedin: string | null;
  avatar: string | null;
  heroImage: string | null;
  verificationStatus: DoctorVerificationStatus;
  verifiedAt: string | null;
  verifiedBy: string | null;
  ratingAverage: number;
  ratingCount: number;
  answerCount: number;
  approvedArticleCount: number;
  acceptedAnswerCount: number;
  helpfulVotes: number;
  rankScore: number;
  createdAt: string;
  updatedAt?: string;
  user?: User;
  clinics?: DoctorClinic[];
};
