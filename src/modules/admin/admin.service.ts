import { Body, Injectable, Param, Patch } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { SessionService } from '../session/session.service';
import { SwapsService } from '../swaps/swaps.service';
import { FeedbackService } from '../feedback/feedback.service';
import { SkillsService } from '../skills/skills.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from './services/audit.service';
import {
  AdminSkillsListResponseDto,
  AdminSkillDetailsDto,
  AdminSkillsQueryDto,
} from './dto/admin-skills.dto';
import {
  AdminSwapsListResponseDto,
  AdminSwapsQueryDto,
} from './dto/admin-swaps.dto';
import {
  AdminSessionsListResponseDto,
  AdminSessionsQueryDto,
} from './dto/admin-sessions.dto';
import { AdminAuditLogsListResponseDto } from './dto/admin-audit.dto';
import { AdminDashboardDto } from './dto/admin-dashboard.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { GamificationService } from '../gamification/gamification.service';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { UpdateBadgeRequirementDto } from './dto/admin-update-badge.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly swapsService: SwapsService,
    private readonly feedbackService: FeedbackService,
    private readonly skillsService: SkillsService,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
    private readonly gamificationService:GamificationService
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
  async deleteSkill(
    skillId: string,
    adminId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    const result = await this.skillsService.deleteSkillForAdmin(skillId);

    // Log the action
    await this.auditService.logAction(
      adminId,
      'DELETE',
      'Skill',
      skillId,
      `Skill deleted successfully`,
      'SUCCESS',
      { skillId },
      ipAddress,
      userAgent,
    );

    return result;
  }

  /**
   * Get all swaps with pagination, filtering, and sorting
   */
  async getAllSwaps(
    query: AdminSwapsQueryDto,
  ): Promise<AdminSwapsListResponseDto> {
    return await this.swapsService.getAllSwapsForAdmin(query);
  }

  /**
   * Export swaps as CSV
   */
  async exportSwaps(swapIds: string[]) {
    return await this.swapsService.exportSwapsAsCSV(swapIds);
  }

  /**
   * Get audit logs with pagination, filtering, and sorting
   */
  async getAuditLogs(
    query: PaginationDto,
  ): Promise<AdminAuditLogsListResponseDto> {
    return await this.auditService.getAuditLogs(query);
  }

  /**
   * Get all sessions with pagination, filtering, and sorting
   */
  async getAllSessions(
    query: AdminSessionsQueryDto,
  ): Promise<AdminSessionsListResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.sessionService.getAllSessionsForAdmin(query);
  }

  /**
   * Export sessions as CSV
   */
  async exportSessions(sessionIds: string[]) {
    return await this.sessionService.exportSessionsAsCSV(sessionIds);
  }

  /// get All badges in system and total user
  async getAllBadgesWithCount() {
     return await this.gamificationService.getAllBadgesWithCount()
  }

  // update badge requirment
 
  async updateBadgeRequirement(badgeId: string , requirement: string,) {
    return await this.gamificationService.updateBadgeRequirement(badgeId, requirement);
  }
 
  async banUser(userId:string, adminId:string, reason?:string) {
    return this.userService.banUser(userId, adminId, reason);
  }

  async unbanUser(userId:string, adminId:string) {
    return this.userService.unbanUser(userId, adminId);
  }

  async suspendUser(userId:string, adminId:string, reason?:string, endAt?:Date ) {
    return this.userService.suspendUser(userId, adminId, reason, endAt );
  }

  async unsuspendUser(userId:string, adminId:string) {
    return this.userService.unsuspendUser(userId, adminId);
  }

  async warnUser(userId: string, adminId:string, reason?:string) {
    return this.userService.warnUser(userId, adminId, reason);
  }

  async addAdminNote(userId:string, adminId:string, reason?:string) {
    return this.userService.addAdminNote(userId, adminId, reason);
  }
  async getUsersForAdmin(status?:'ACTIVE' | 'SUSPENDED' | 'BANNED' , search?:string) {
    return this.userService.getUsersForAdmin(status , search)
  }
  async getUsersStats() {
     return this.userService.getUsersStats()
 } 
}
