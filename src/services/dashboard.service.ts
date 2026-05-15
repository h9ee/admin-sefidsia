import { apiGet } from "@/lib/axios";
import type { DashboardData, StatsRange } from "@/types";

export const dashboardService = {
  overview() {
    return apiGet<DashboardData>("/admin/dashboard");
  },
  stats(rangeDays = 30) {
    return apiGet<StatsRange>("/admin/stats", { range: rangeDays });
  },
};
