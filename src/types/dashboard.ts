export type DashboardStats = {
  users: number;
  articles: number;
  questions: number;
  doctors: number;
  reports: number;
  pendingDoctors: number;
};

export type ChartPoint = { label: string; value: number };

export type ActivityEvent = {
  id: string;
  actor: string;
  actorAvatar?: string | null;
  action: string;
  target?: string;
  createdAt: string;
};

export type DashboardData = {
  stats: DashboardStats;
  trafficLast7Days: ChartPoint[];
  contentBreakdown: ChartPoint[];
  latestUsers: { id: string; fullName: string; email: string; createdAt: string; avatar?: string | null }[];
  latestArticles: { id: string; title: string; status: string; createdAt: string; authorName?: string }[];
  latestReports: { id: string; reason: string; targetType: string; createdAt: string; isDangerous: boolean }[];
  activity: ActivityEvent[];
};
