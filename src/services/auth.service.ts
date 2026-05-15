import { apiGet, apiPost } from "@/lib/axios";
import type { AuthSession, TokenPair, User } from "@/types";

export type OtpPurpose = "login" | "reset";

export type CheckMobileResponse = {
  exists: boolean;
  hasPassword: boolean;
};

export type RequestOtpResponse = {
  expiresIn: number;
  sentTo: string;
};

export type VerifyOtpLoginResponse = {
  kind: "login";
  user: User;
  tokens: TokenPair;
  /** true when the user has no password yet — UI may prompt to set one. */
  shouldSuggestPassword: boolean;
};

export type VerifyOtpResetResponse = {
  kind: "reset";
  resetToken: string;
  expiresIn: number;
};

export type VerifyOtpResponse =
  | VerifyOtpLoginResponse
  | VerifyOtpResetResponse;

export const authService = {
  checkMobile(mobile: string) {
    return apiPost<CheckMobileResponse>("/auth/check-mobile", { mobile });
  },
  requestOtp(payload: { mobile: string; purpose: OtpPurpose }) {
    return apiPost<RequestOtpResponse>("/auth/request-otp", payload);
  },
  verifyOtp(payload: { mobile: string; code: string; purpose: OtpPurpose }) {
    return apiPost<VerifyOtpResponse>("/auth/verify-otp", payload);
  },
  loginWithPassword(payload: { mobile: string; password: string }) {
    return apiPost<AuthSession>("/auth/login", payload);
  },
  setPassword(password: string) {
    return apiPost<{ ok: true }>("/auth/set-password", { password });
  },
  resetPassword(payload: { resetToken: string; password: string }) {
    return apiPost<{ ok: true }>("/auth/reset-password", payload);
  },
  refresh(refreshToken: string) {
    return apiPost<TokenPair>("/auth/refresh", { refreshToken });
  },
  me() {
    return apiGet<User>("/auth/me");
  },
  /**
   * Backend exposes no logout endpoint; we just discard tokens client-side.
   */
  async logout() {
    // no-op
  },
};
