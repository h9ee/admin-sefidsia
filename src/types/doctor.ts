export type DoctorVerificationStatus = "pending" | "verified" | "rejected";

export type Doctor = {
  id: string;
  userId: string;
  fullName: string;
  avatar?: string | null;
  specialty: string;
  medicalNumber: string;
  bio?: string;
  yearsOfExperience?: number;
  city?: string;
  rank?: number;
  rating?: number;
  answersCount?: number;
  articlesCount?: number;
  status: DoctorVerificationStatus;
  documents?: { id: string; name: string; url: string }[];
  verifiedAt?: string | null;
  createdAt: string;
};
