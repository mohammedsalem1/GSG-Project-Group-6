/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { SessionService } from '../session/session.service';
import { SwapsService } from '../swaps/swaps.service';
import { FeedbackService } from '../feedback/feedback.service';
import { SkillsService } from '../skills/skills.service';
import { PrismaService } from '../../database/prisma.service';
import {
  AdminSkillsListResponseDto,
  AdminSkillDetailsDto,
  AdminSkillsQueryDto,
} from './dto/admin-skills.dto';

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

@Injectable()
export class AdminService {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly swapsService: SwapsService,
    private readonly feedbackService: FeedbackService,
    private readonly skillsService: SkillsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Returns full dashboard data in one request for admin/dashboard.
   * Optional month (1-12) and year; defaults to current month.
   */
  async getDashboard(
    month?: number,
    year?: number,
  ): Promise<AdminDashboardDto> {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const [
      completedSessionsThisWeek,
      activeUsers,
      totalSwapThisWeek,
      weeklyReports,
      completedSessionsChart,
      topSkills,
      mostActiveUsers,
      requestsVsSessions,
      newUsers,
      usersRatedAbove3,
      usersRatedBelow3,
      usersWithMultipleCancellations,
      flaggedUsersThisMonth,
      totalUsers,
    ] = await Promise.all([
      this.sessionService.getCompletedSessionsCountThisWeek(),
      this.userService.getActiveUsersCount(startOfWeek, endOfWeek),
      this.swapsService.getTotalSwapsCompletedThisWeek(),
      this.feedbackService.getWeeklyReportsCount(),
      this.sessionService.getCompletedSessionsByDay(y, m),
      this.swapsService.getTopSkillsBySwapCount(y, m, 10),
      this.userService.getMostActiveUsers(y, m, 10),
      this.sessionService.getRequestsVsSessionsByWeek(y, m),
      this.userService.getNewUsersCount(y, m),
      this.userService.getUsersRatedAbove3Count(y, m),
      this.userService.getUsersRatedBelow3Count(y, m),
      this.userService.getUsersWithMultipleCancellationsCount(y, m),
      this.userService.getFlaggedUsersCountInMonth(y, m),
      this.prisma.user.count(),
    ]);

    const pct = (n: number) =>
      totalUsers > 0 ? Math.round((n / totalUsers) * 100) : 0;

    return {
      summary: {
        completedSessionsThisWeek,
        activeUsers,
        totalSwapThisWeek,
        weeklyReports,
      },
      completedSessionsChart,
      topSkills,
      mostActiveUsers,
      requestsVsSessions,
      userOverview: {
        newUsers,
        newUsersPercentage: pct(newUsers),
        usersRatedAbove3,
        usersRatedAbove3Percentage: pct(usersRatedAbove3),
        usersRatedBelow3,
        usersRatedBelow3Percentage: pct(usersRatedBelow3),
        usersWithMultipleCancellations,
        usersWithMultipleCancellationsPercentage: pct(
          usersWithMultipleCancellations,
        ),
        flaggedUsersThisMonth,
        flaggedUsersThisMonthPercentage: pct(flaggedUsersThisMonth),
      },
      period: { year: y, month: m },
    };
  }

  /**
   * Get all skills with pagination, filtering, and sorting
   */
  async getAllSkills(
    query: AdminSkillsQueryDto,
  ): Promise<AdminSkillsListResponseDto> {
    return await this.skillsService.getAllSkillsForAdmin(query);
  }

  /**
   * Get detailed information about a specific skill
   */
  async getSkillDetails(skillId: string): Promise<AdminSkillDetailsDto> {
    return await this.skillsService.getSkillDetailsForAdmin(skillId);
  }

  /**
   * Delete a skill (soft delete by setting isActive to false)
   */
  async deleteSkill(skillId: string): Promise<{ message: string }> {
    return await this.skillsService.deleteSkillForAdmin(skillId);
  }
}
