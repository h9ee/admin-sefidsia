import type { Permission } from "./permission";
import type { Role } from "./role";

export type User = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string | null;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  roles: Role[];
};

export type AuthSession = {
  user: User;
  permissions: Permission[];
  accessToken: string;
  refreshToken: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};
