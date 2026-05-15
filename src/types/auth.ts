import type { Role } from "./role";

export type UserStatus = "active" | "blocked" | "pending";
export type UserType = "normal" | "doctor" | "admin";
export type Gender = "male" | "female" | "other";

export type User = {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  mobile: string | null;
  avatar: string | null;
  bio: string | null;
  gender: Gender | null;
  birthDate: string | null;
  status: UserStatus;
  userType: UserType;
  reputation: number;
  xp: number;
  level: number;
  isVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt?: string;
  roles?: Role[];
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type AuthSession = {
  user: User;
  tokens: TokenPair;
};

/* Auth payloads now live in src/services/auth.service.ts.
 * Login is mobile-only with OTP fallback when the user has no password set. */
