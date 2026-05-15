import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/axios";
import type { Permission, Role } from "@/types";

export type CreateRolePayload = {
  name: string;
  slug: string;
  description?: string;
};

export const rolesService = {
  list() {
    return apiGet<Role[]>("/roles");
  },
  get(id: string) {
    return apiGet<Role>(`/roles/${id}`);
  },
  create(payload: CreateRolePayload) {
    return apiPost<Role>("/roles", payload);
  },
  update(id: string, payload: Partial<CreateRolePayload>) {
    return apiPatch<Role>(`/roles/${id}`, payload);
  },
  remove(id: string) {
    return apiDelete(`/roles/${id}`);
  },
  setPermissions(roleId: string, permissionIds: string[]) {
    return apiPut<null>(`/roles/${roleId}/permissions`, { permissionIds });
  },
  addPermission(roleId: string, permissionId: string) {
    return apiPost<null>(`/roles/${roleId}/permissions`, { permissionId });
  },
  removePermission(roleId: string, permissionId: string) {
    return apiDelete(`/roles/${roleId}/permissions/${permissionId}`);
  },
};

export const permissionsService = {
  list() {
    return apiGet<Permission[]>("/permissions");
  },
  get(id: string) {
    return apiGet<Permission>(`/permissions/${id}`);
  },
  create(payload: Omit<Permission, "id" | "createdAt" | "updatedAt">) {
    return apiPost<Permission>("/permissions", payload);
  },
  update(id: string, payload: Partial<Omit<Permission, "id">>) {
    return apiPatch<Permission>(`/permissions/${id}`, payload);
  },
  remove(id: string) {
    return apiDelete(`/permissions/${id}`);
  },
};
