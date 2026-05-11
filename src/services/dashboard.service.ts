import { api } from "@/lib/axios";
import type { DashboardData } from "@/types";

export const dashboardService = {
  async overview() {
    const { data } = await api.get<DashboardData>("/admin/dashboard");
    return data;
  },
};
