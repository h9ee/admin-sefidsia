import { api } from "@/lib/axios";
import type { AuthSession, LoginPayload, User } from "@/types";

export const authService = {
  async login(payload: LoginPayload): Promise<AuthSession> {
    const { data } = await api.post<AuthSession>("/auth/login", payload);
    return data;
  },
  async me(): Promise<{ user: User; permissions: string[] }> {
    const { data } = await api.get<{ user: User; permissions: string[] }>("/auth/me");
    return data;
  },
  async logout(): Promise<void> {
    await api.post("/auth/logout").catch(() => undefined);
  },
  async changePassword(payload: { currentPassword: string; newPassword: string }) {
    const { data } = await api.post("/auth/change-password", payload);
    return data;
  },
};
