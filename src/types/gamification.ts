import type { User } from "./auth";

export type BadgeType = "user" | "doctor" | "article" | "question" | "answer";

export type Badge = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  xpReward: number;
  type: BadgeType;
  createdAt: string;
};

export type XPLog = {
  id: string;
  userId: string;
  source: string;
  amount: number;
  createdAt: string;
};

export type GamificationStatus = {
  xp: number;
  level: number;
  reputation: number;
  nextLevelXp?: number;
  badges?: Badge[];
};

export type LeaderboardEntry = User & {
  xp: number;
  level: number;
  reputation: number;
};
