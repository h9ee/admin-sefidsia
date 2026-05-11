import { api } from "@/lib/axios";
import type { Paginated, PermissionGroup, Role } from "@/types";

export const rolesService = {
  async list() {
    const { data } = await api.get<Paginated<Role>>("/admin/roles");
    return data;
  },
  async get(id: string) {
    const { data } = await api.get<Role>(`/admin/roles/${id}`);
    return data;
  },
  async create(payload: Pick<Role, "name" | "slug" | "description" | "permissions">) {
    const { data } = await api.post<Role>("/admin/roles", payload);
    return data;
  },
  async update(id: string, payload: Partial<Role>) {
    const { data } = await api.patch<Role>(`/admin/roles/${id}`, payload);
    return data;
  },
  async remove(id: string) {
    await api.delete(`/admin/roles/${id}`);
  },
  async permissionGroups() {
    const { data } = await api.get<PermissionGroup[]>("/admin/permissions");
    return data;
  },
};
