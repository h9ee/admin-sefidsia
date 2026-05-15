import type { User } from "./auth";

export type DoctorVerificationStatus = "pending" | "approved" | "rejected";

export type Doctor = {
  id: string;
  userId: string;
  medicalCode: string;
  specialty: string;
  subSpecialty: string | null;
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
};
