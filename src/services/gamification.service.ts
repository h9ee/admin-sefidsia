import { apiGet, apiList } from "@/lib/axios";
import type {
  Badge,
  GamificationStatus,
  LeaderboardEntry,
  XPLog,
} from "@/types";

export const gamificationService = {
  me() {
    return apiGet<GamificationStatus>("/gamification/me");
  },
  badges() {
    return apiGet<Badge[]>("/gamification/badges");
  },
  leaderboard(params: { limit?: number; userType?: "normal" | "doctor" | "admin" } = {}) {
    return apiGet<LeaderboardEntry[]>("/gamification/leaderboard", params);
  },
  myXpLogs(params: { page?: number; limit?: number } = {}) {
    return apiList<XPLog>("/gamification/xp-logs", params);
  },
};
