import { apiDelete, apiGet, apiList, apiPatch, apiPost } from "@/lib/axios";
import type { Gender, User, UserStatus, UserType } from "@/types";

export type UsersQuery = {
  page?: number;
  limit?: number;
  q?: string;
  status?: UserStatus;
  userType?: UserType;
  sortBy?: "createdAt" | "username" | "xp" | "reputation";
  sortOrder?: "ASC" | "DESC";
};

export type UpdateUserPayload = {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  gender?: Gender;
  birthDate?: string;
  email?: string;
  mobile?: string;
  status?: UserStatus;
  userType?: UserType;
};

export const usersService = {
  list(params: UsersQuery = {}) {
    return apiList<User>("/users", params);
  },
  get(id: string) {
    return apiGet<User>(`/users/${id}`);
  },
  update(id: string, payload: UpdateUserPayload) {
    return apiPatch<User>(`/users/${id}`, payload);
  },
  remove(id: string) {
    return apiDelete(`/users/${id}`);
  },
  setStatus(id: string, status: UserStatus) {
    return apiPatch<User>(`/users/${id}`, { status });
  },
  assignRole(userId: string, roleId: string) {
    return apiPost<null>(`/users/${userId}/roles`, { roleId });
  },
  removeRole(userId: string, roleId: string) {
    return apiDelete(`/users/${userId}/roles/${roleId}`);
  },
  /**
   * Replace user's role set client-side (no batch endpoint on backend):
   * computes diff against current roles and dispatches add/remove calls.
   */
  async setRoles(userId: string, current: string[], next: string[]) {
    const toAdd = next.filter((r) => !current.includes(r));
    const toRemove = current.filter((r) => !next.includes(r));
    await Promise.all(toAdd.map((rid) => this.assignRole(userId, rid)));
    await Promise.all(toRemove.map((rid) => this.removeRole(userId, rid)));
  },
};
