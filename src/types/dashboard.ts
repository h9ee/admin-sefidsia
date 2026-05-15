export type DashboardData = {
  users: { total: number; newLast7d: number };
  doctors: { active: number; pending: number };
  articles: { total: number; published: number; pendingReview: number };
  qa: { totalQuestions: number; unansweredQuestions: number; totalAnswers: number };
  community: { comments: number; tags: number };
  moderation: { pendingReports: number };
};

export type StatsRange = {
  rangeDays: number;
  counts: {
    users: number;
    articles: number;
    questions: number;
    answers: number;
  };
};

export type ChartPoint = { label: string; value: number };
