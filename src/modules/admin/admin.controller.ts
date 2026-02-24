import {
  Controller,
  Get,
  Query,
  UseGuards,
  Delete,
  Param,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
  ApiParam,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiUnauthorizedResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  AdminSkillsListResponseDto,
  AdminSkillDetailsDto,
  AdminSkillsQueryDto,
} from './dto/admin-skills.dto';
import {
  AdminSwapsListResponseDto,
  AdminSwapsQueryDto,
  AdminSwapExportDto,
  AdminUserSwapsQueryDto,
} from './dto/admin-swaps.dto';
import {
  AdminSessionsListResponseDto,
  AdminSessionsQueryDto,
  AdminSessionExportDto,
} from './dto/admin-sessions.dto';
import { AdminAuditLogsListResponseDto } from './dto/admin-audit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import type { RequestUser } from 'src/common/types/user.types';
import { AdminDashboardDto } from './dto/admin-dashboard.dto';
import type { Request, Response } from 'express';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Public } from '@prisma/client/runtime/library';
import { UpdateBadgeRequirementDto } from './dto/admin-update-badge.dto';
import { AddNoteToUser, AddUserActionDto, AddUserActionWithEndDateDto } from './dto/admin-add-user-action.dto';
import { UserListQueryDto } from './dto/admin-user-list.dto';
import { AdjustUserPointsDto } from './dto/admin-adjust-points-user.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
// add Amin Role ---
@Roles(Role.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard data (single request)' })
  @ApiOkResponse({
    description: 'Dashboard summary, charts, and user overview',
    schema: {
      example: {
        summary: {
          completedSessionsThisWeek: 320,
          activeUsers: 50,
          totalSwapThisWeek: 94,
          weeklyReports: 7,
        },
        completedSessionsChart: [
          { day: 1, count: 5 },
          { day: 2, count: 8 },
        ],
        topSkills: [{ skillName: 'Technology', swaps: 20, percentage: 91 }],
        mostActiveUsers: [
          { userName: 'Omar Ali', image: 'https://...', swaps: 20 },
        ],
        requestsVsSessions: [{ week: 1, requests: 70, sessions: 55 }],
        userOverview: {
          newUsers: 60,
          newUsersPercentage: 45,
          usersRatedAbove3: 80,
          usersRatedAbove3Percentage: 55,
          usersRatedBelow3: 20,
          usersRatedBelow3Percentage: 25,
          usersWithMultipleCancellations: 15,
          usersWithMultipleCancellationsPercentage: 15,
          flaggedUsersThisMonth: 12,
          flaggedUsersThisMonthPercentage: 10,
        },
        period: { year: 2022, month: 9 },
      },
    },
  })
  @ApiQuery({
    name: 'month',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
  })
  async getDashboard(
    @Query('month') month?: string,
    @Query('year') year?: string,
  ): Promise<AdminDashboardDto> {
    const m = month ? parseInt(month, 10) : undefined;
    const y = year ? parseInt(year, 10) : undefined;
    return this.adminService.getDashboard(m, y);
  }

  @Get('skills')
  @ApiOperation({ summary: 'Get all skills with pagination and filtering' })
  @ApiOkResponse({
    description: 'Skills fetched successfully',
    type: AdminSkillsListResponseDto,
  })
  async getAllSkills(
    @Query() query: AdminSkillsQueryDto,
  ): Promise<AdminSkillsListResponseDto> {
    return await this.adminService.getAllSkills(query);
  }

  @Get('skills/:id')
  @ApiOperation({ summary: 'Get skill details by ID' })
  @ApiParam({
    name: 'id',
    description: 'Skill ID',
    type: String,
  })
  @ApiOkResponse({
    description: 'Skill details fetched successfully',
    type: AdminSkillDetailsDto,
  })
  @ApiNotFoundResponse({ description: 'Skill not found' })
  async getSkillDetails(
    @Param('id') skillId: string,
  ): Promise<AdminSkillDetailsDto> {
    return await this.adminService.getSkillDetails(skillId);
  }

  @Delete('skills/:id')
  @ApiOperation({ summary: 'Delete a skill' })
  @ApiParam({
    name: 'id',
    description: 'Skill ID',
    type: String,
  })
  @ApiOkResponse({ description: 'Skill deleted successfully' })
  @ApiNotFoundResponse({ description: 'Skill not found' })
  @ApiBadRequestResponse({ description: 'Skill is already deleted' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async deleteSkill(
    @Param('id') skillId: string,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    return await this.adminService.deleteSkill(
      skillId,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Get('swaps')
  @ApiOperation({ summary: 'Get all swaps with pagination and filtering' })
  @ApiOkResponse({
    description: 'Swaps fetched successfully',
    type: AdminSwapsListResponseDto,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [
      'PENDING',
      'ACCEPTED',
      'DECLINED',
      'EXPIRED',
      'COMPLETED',
      'CANCELLED',
    ],
    description: 'Filter by swap status',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['newest', 'oldest'],
    description: 'Sort by creation date',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for range filter (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for range filter (YYYY-MM-DD)',
  })
  async getAllSwaps(
    @Query() query: AdminSwapsQueryDto,
  ): Promise<AdminSwapsListResponseDto> {
    return await this.adminService.getAllSwaps(query);
  }

  @Post('swaps/export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export selected swaps as CSV' })
  @ApiOkResponse({
    description: 'CSV file',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async exportSwaps(@Body() dto: AdminSwapExportDto, @Res() res: Response) {
    const file = await this.adminService.exportSwaps(dto.swapIds);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="swaps.csv"');
    res.send(file);
  }

  @Get('audit')
  @ApiOperation({ summary: 'Get audit logs with pagination and filtering' })
  @ApiOkResponse({
    description: 'Audit logs fetched successfully',
    type: AdminAuditLogsListResponseDto,
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
  })
  async getAuditLogs(
    @Query() query: PaginationDto,
  ): Promise<AdminAuditLogsListResponseDto> {
    return await this.adminService.getAuditLogs(query);
  }

  @Get('sessions')
  @ApiOperation({
    summary: 'Get all sessions with pagination, filtering, and sorting',
  })
  @ApiOkResponse({
    description: 'Sessions fetched successfully',
    type: AdminSessionsListResponseDto,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name or email',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'],
    description: 'Filter by session status',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['newest', 'oldest'],
    description: 'Sort by date',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for range filter (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for range filter (YYYY-MM-DD)',
  })
  async getAllSessions(
    @Query() query: AdminSessionsQueryDto,
  ): Promise<AdminSessionsListResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
    return await this.adminService.getAllSessions(query);
  }

  @Post('sessions/export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export selected sessions as CSV' })
  @ApiOkResponse({
    description: 'CSV file',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async exportSessions(
    @Body() dto: AdminSessionExportDto,
    @Res() res: Response,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const file = await this.adminService.exportSessions(dto.sessionIds);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="swaps.csv"');
    res.send(file);
  }

  @Get('badges')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({summary: 'Get all system badges with total users count'})
  @ApiOkResponse({description: 'Badges retrieved successfully'})
  async getAllBadges() {
    return this.adminService.getAllBadgesWithCount();
  }

    // update badge requirment
    @Patch(':badgeId/requirement')
    @ApiOperation({ summary: 'Update badge requirement' })
    @ApiParam({ name: 'badgeId', example: 'uuid-badge-id' })
    @ApiOkResponse({ description: 'Requirement updated successfully'})
    @ApiNotFoundResponse({description: 'the badge not found'})
    async updateBadgeRequirement(
      @Param('badgeId') badgeId: string,
      @Body() dto: UpdateBadgeRequirementDto,
    ) {
          return this.adminService.updateBadgeRequirement(badgeId, dto.requirement);
    }
  
   // ==============================
  // 👤 USER ACTIONS
  // ==============================

  @Post(':userId/ban')
  @ApiOperation({ summary: 'Ban user' })
  async banUser(@Param('userId') userId: string,@CurrentUser() admin:RequestUser, @Body() body: AddUserActionDto) {
    return this.adminService.banUser( userId, admin.id, body.reason );
  }

  @Post(':userId/unban')
  @ApiOperation({ summary: 'Unban user' })
  async unbanUser(@Param('userId') userId: string,@CurrentUser() admin:RequestUser) {
    return this.adminService.unbanUser(userId, admin.id);
  }

  @Post(':userId/suspend')
  @ApiOperation({ summary: 'Suspend user' })
  async suspendUser(@Param('userId') userId: string, @CurrentUser() admin:RequestUser, @Body() body: AddUserActionWithEndDateDto) {
    return this.adminService.suspendUser( userId, admin.id, body.reason ,body.endAt );
  }

  // @Post(':userId/unsuspend')
  // async unsuspendUser(@Param('userId') userId: string, @CurrentUser() admin: RequestUser) {
  //   return this.adminService.unsuspendUser({ userId, adminId: user.id });
  // }

  @Post(':userId/warn')
  @ApiOperation({ summary: 'Warn user' })
  async warnUser(@Param('userId') userId: string, @CurrentUser() admin: RequestUser, @Body() body: AddUserActionDto) {
    return this.adminService.warnUser(userId, admin.id, body.reason );
  }

  @Post(':userId/note')
  @ApiOperation({ summary: 'Add admin note to user' })
  async addAdminNote(@Param('userId') userId: string, @CurrentUser() admin: RequestUser, @Body() body: AddNoteToUser) {
    return this.adminService.addAdminNote(userId, admin.id, body.externalNote);
  }

    @Get('users')
    @ApiOperation({ summary: 'Get all users for admin with optional filters' })
    @ApiOkResponse({
      description: 'Get users successfully',
      schema: {
        example: {
          success: true,
          data: {
            "users": [
                {
                  "id": "user-id",
                  "name": "user-name ",
                  "email": "user-email",
                  "status": "user-active",
                  "points": "user-points",
                  "badges": []
                },   
              ],
              "pagination": {
                "total": 1,
                "page": 1,
                "limit": 10,
                "totalPages": 1,
                "hasNextPage": false,
                "hasPrevPage": false
              }
          },
        },
      },
    })
    async getAllUsersForAdmin(
      @Query() query: UserListQueryDto,
    ) {
      return this.adminService.getUsersForAdmin(query);
    }



    @Get('users/stats')
    @ApiUnauthorizedResponse({
        description: 'Unauthorized - Invalid or missing token',
    })
    @ApiOkResponse({
          description: 'Get users statistics successfully',
          schema: {
            example: {
              success: true,
              "data": {
                  "totalUsers": 120,
                  "active": 119,
                  "banned": 1,
                  "suspended": 0
                }
              }
          } 
      }
    )
    @ApiOperation({ summary: 'Get users statistics for dashboard like totalUsers,active,banned,suspended' })
    @Roles(Role.ADMIN)
    async getUsersStats() {
      return this.adminService.getUsersStats();
    }

   /**
   * User Overview endpoint
   * Returns user profile + all admin notes
   */
  @Get(':id/overview')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user overview (profile + all admin notes)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiOkResponse({
    description: 'User overview fetched successfully',
    schema: {
      example: {
        profile: {
          id: 'user-uuid',
          userName: 'John Doe',
          email: 'john@example.com',
          status: 'ACTIVE',
          createdAt: '2026-02-22T10:00:00Z'
        },
        adminNotes: [
          {
            adminId: 'admin-uuid',
            externalNote: 'Checked user activity',
            createdAt: '2026-02-22T12:30:00Z'
          },
          {
            adminId: 'admin-uuid2',
            externalNote: 'Internal observation',
            createdAt: '2026-02-20T09:15:00Z'
          }
        ]
      }
    }
  })
  async getOverviewUserForAdmin(@Param('id') userId: string) {
    return this.adminService.getOverviewUserForAdmin(userId);
  }

   // ===== Get User Activity Log =====
  @Get('users/:id/activity-log')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get activity log for a user (Admin Notes + User Restrictions)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiOkResponse({
    description: 'User activity log retrieved successfully',
    schema: {
      example: [
        {
          entity: 'AdminNote',
          type: 'ADMIN_NOTE',
          adminId: 'admin-uuid',
          externalNote: 'Internal observation',
          createdAt: '2026-02-22T12:30:00Z'
        },
        {
          entity: 'UserRestriction',
          type: 'BANNED',
          adminId: 'admin-uuid',
          reason: 'Violation of rules',
          endAt: '2026-03-01T00:00:00Z',
          metadata: { oldStatus: 'ACTIVE', newStatus: 'BANNED' },
          createdAt: '2026-02-21T08:00:00Z'
        }
      ]
    }
  })
  async getUserActivityLog(@Param('id') userId: string) {
    return this.adminService.getUserActivityLog(userId);
  }


  /////////////
  @Get(':userId/swaps')
  @ApiOperation({
    summary: 'Get user swaps (Sent or Received)',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
  })
  @ApiOkResponse({
    description: 'User swaps retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          data: [
            {
              id: 'swap-id',
              user: {
                id: 'other-user-id',
                userName: 'John',
                image: 'image-url',
              },
              requestType: 'Skill Swap',
              requestedSkill: {
                id: 'skill-id',
                name: 'JavaScript',
              },
              offeredSkill: {
                id: 'skill-id',
                name: 'React',
              },
              status: 'PENDING',
              dateTime: '2026-02-22T10:00:00.000Z',
            },
          ],
          pagination: {
            total: 20,
            page: 1,
            limit: 10,
            totalPages: 2,
            nextPage: 2,
            prevPage: null,
            hasNextPage: true,
            hasPrevPage: false,
          },
        },
      },
    },
  })
  async getUserSwapsForAdmin(
    @Param('userId') userId: string,
    @Query() query: AdminUserSwapsQueryDto,
  ) {
    return this.adminService.getUserSwapsForAdmin(userId, query);
  }


 // Get userSession
  @Get(':userId/sessions')
  @ApiOperation({
    summary: 'Get all User sessions for admin dashboard'})
  @ApiOkResponse({
    description: 'User sessions retrieved successfully',
    schema: {
      example: {
        success: true,
        user: {
          id: 'user-uuid',
          userName: 'John Doe',
          email: 'john@example.com',
          image: 'https://example.com/avatar.jpg'
        },
        data: [
          {
            id: 'session-uuid',
            scheduledAt: '2026-02-22T10:00:00.000Z',
            endsAt: '2026-02-22T11:00:00.000Z',
            status: 'COMPLETED',
            duration: 60, // minutes
            skillName: 'JavaScript',
            partner: {
              id: 'partner-uuid',
              userName: 'Jane Smith',
              image: 'https://example.com/avatar2.jpg'
            }
          },
        ],
        pagination: {
          total: 50,
          page: 1,
          limit: 10,
          totalPages: 5,
          nextPage: 2,
          prevPage: null,
          hasNextPage: true,
          hasPrevPage: false
        }
      }
    }
  })
   @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: 'uuid-user-id',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin access required',
  })
  async getAllSessionsForAdmin(
    @Param('userId') userId: string,
    @Query() query: AdminSessionsQueryDto,
  ) {
    return this.adminService.getUserSessionsForAdmin(userId , query);
  }


  // get User Badge
  @Get('badge/:userId')
  @ApiOperation({
    summary: 'Get user badges (earned and locked)',
    description:
      'Returns earned badges (with unlock time) and locked badges (with progress percentage and remaining sessions).',
  })
  @ApiParam({
    name: 'userId',
    example: 'uuid-user-id',
    description: 'The ID of the user',
  })
  @ApiOkResponse({
  description: 'User badges retrieved successfully',
  schema: {
    example: {
      success: true,
      data: {
        earned: [
          {
            id: 'badge-uuid',
            name: 'Session Master',
            icon: 'https://example.com/badge-icon.png',
            unlockedAt: '2026-02-21T14:30:00Z',
            progress: '100%' // fully earned
          }
        ],
        locked: [
          {
            id: 'badge-uuid-2',
            name: 'Skill Collector',
            icon: 'https://example.com/badge-icon2.png',
            progress: '40/50', // 40 sessions completed out of 50
            remainingSessions: 10
          }
        ]
      }
    }
  }
})
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async getAllUserBadges(
    @Param('userId') userId: string,
  ) {
    return await this.adminService.getAllUserBadges(userId);
  }


  // addPoints or Deduct Points
  
  @Post(':userId/points')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Adjust user points (Admin only)'})
  @ApiParam({
    name: 'userId',
    description: 'UUID of the user',
    example: 'c1f7b9a2-1234-4d89-9abc-123456789abc',
  })
  @ApiOkResponse({
    description: 'User points adjusted successfully',
    schema: {
      example: {
        message: 'User points adjusted successfully',
        data: {
          userId: 'c1f7b9a2-1234-4d89-9abc-123456789abc',
          adjustedBy: -20,
          currentPoints: 80,
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Access denied. Admins only.' })
  async adjustUserPoints(
    @Param('userId') userId: string,
    @Body() dto: AdjustUserPointsDto,
  ) {
    return this.adminService.adjustUserPoints(userId, dto);
  }
}

