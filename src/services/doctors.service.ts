import { api } from "@/lib/axios";
import type { Doctor, Paginated } from "@/types";

export type DoctorsQuery = {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  specialty?: string;
};

export const doctorsService = {
  async list(params: DoctorsQuery = {}) {
    const { data } = await api.get<Paginated<Doctor>>("/admin/doctors", { params });
    return data;
  },
  async get(id: string) {
    const { data } = await api.get<Doctor>(`/admin/doctors/${id}`);
    return data;
  },
  async verify(id: string, note?: string) {
    const { data } = await api.post<Doctor>(`/admin/doctors/${id}/verify`, { note });
    return data;
  },
  async reject(id: string, note?: string) {
    const { data } = await api.post<Doctor>(`/admin/doctors/${id}/reject`, { note });
    return data;
  },
  async ranking() {
    const { data } = await api.get<Doctor[]>("/admin/doctors/ranking");
    return data;
  },
};
