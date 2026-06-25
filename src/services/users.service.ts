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
  // `null` clears the column server-side; `undefined`/omission means "no
  // change" (partial PATCH). The backend's `nullableText` validators
  // accept both null and a non-empty string for these fields.
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  avatar?: string | null;
  gender?: Gender | null;
  birthDate?: string | null;
  // `email`/`mobile` are NOT nullable on the backend — only omit them
  // when empty (don't send `null`).
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
   * Replace user's role set. Single-role-per-user is now a hard backend
   * invariant — `POST /users/:id/roles` is a REPLACE (drops any prior
   * role row before inserting the new one), and `DELETE /users/:id/roles/:roleId`
   * wipes whichever role the user currently has.
   *
   * Earlier we ran an add-then-remove diff. That was wrong under the new
   * backend: the trailing `removeRole` would erase the role we just
   * assigned, because `removeRole` no longer filters by `roleId`. Now:
   *
   *   - `next` has a role → one POST. Done.
   *   - `next` is empty   → one DELETE (any current roleId works since the
   *                          backend drops all rows for that user anyway).
   *   - Picked role is unchanged → no-op.
   *
   * `current` is kept in the signature for callers that already track it
   * locally, even though the new logic doesn't need a full diff.
   */
  async setRoles(userId: string, current: string[], next: string[]) {
    const nextRole = next[0];
    if (nextRole) {
      // No-op when the user already has exactly this role.
      if (current.length === 1 && current[0] === nextRole) return;
      await this.assignRole(userId, nextRole);
      return;
    }
    // Clearing the role: pick any existing roleId for the DELETE URL — the
    // backend ignores the param and removes whichever role row exists.
    if (current.length > 0) {
      await this.removeRole(userId, current[0]);
    }
  },
};
