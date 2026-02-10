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

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
// add Amin Role
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
}
