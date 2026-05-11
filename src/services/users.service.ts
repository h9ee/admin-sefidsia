import { api } from "@/lib/axios";
import type { Paginated, User } from "@/types";

export type UsersQuery = {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  role?: string;
  sort?: string;
};

export type UserUpsertPayload = {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  isActive?: boolean;
  isVerified?: boolean;
  roles?: string[];
};

export const usersService = {
  async list(params: UsersQuery = {}) {
    const { data } = await api.get<Paginated<User>>("/admin/users", { params });
    return data;
  },
  async get(id: string) {
    const { data } = await api.get<User>(`/admin/users/${id}`);
    return data;
  },
  async create(payload: UserUpsertPayload & { password: string }) {
    const { data } = await api.post<User>("/admin/users", payload);
    return data;
  },
  async update(id: string, payload: UserUpsertPayload) {
    const { data } = await api.patch<User>(`/admin/users/${id}`, payload);
    return data;
  },
  async remove(id: string) {
    await api.delete(`/admin/users/${id}`);
  },
  async toggleActive(id: string, active: boolean) {
    const { data } = await api.patch<User>(`/admin/users/${id}/active`, { active });
    return data;
  },
};
