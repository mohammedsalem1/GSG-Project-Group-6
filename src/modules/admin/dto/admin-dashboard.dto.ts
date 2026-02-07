export interface AdminDashboardDto {
  summary: {
    completedSessionsThisWeek: number;
    activeUsers: number;
    totalSwapThisWeek: number;
    weeklyReports: number;
  };
  completedSessionsChart: { day: number; count: number }[];
  topSkills: { skillName: string; swaps: number; percentage: number }[];
  mostActiveUsers: { userName: string; image: string | null; swaps: number }[];
  requestsVsSessions: { week: number; requests: number; sessions: number }[];
  userOverview: {
    newUsers: number;
    newUsersPercentage: number;
    usersRatedAbove3: number;
    usersRatedAbove3Percentage: number;
    usersRatedBelow3: number;
    usersRatedBelow3Percentage: number;
    usersWithMultipleCancellations: number;
    usersWithMultipleCancellationsPercentage: number;
    flaggedUsersThisMonth: number;
    flaggedUsersThisMonthPercentage: number;
  };
  period: { year: number; month: number };
}
