/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SessionService } from './session.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from 'src/common/types/user.types';
import { GamificationService } from '../gamification/gamification.service';
import {
  CancelSessionDto,
  CompleteSessionDto,
  GetSessionsQueryDto,
} from './dto';

@ApiTags('sessions')
@Controller('sessions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SessionController {
  constructor( private readonly sessionService: SessionService   ) {}

  @Get('my-sessions')
  @ApiOperation({ summary: 'Get my sessions (as host or attendee)' })
  @ApiOkResponse({
    description: 'Sessions retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          data: [
            {
              id: 'session-id',
              title: 'JavaScript Session',
              description: 'Learning JavaScript from john',
              scheduledAt: '2026-02-10T14:00:00.000Z',
              endsAt: '2026-02-10T15:30:00.000Z',
              duration: 90,
              communication: 'TEXT_CHAT',
              status: 'SCHEDULED',
              host: {
                id: 'host-id',
                userName: 'john',
                image: null,
              },
              attendee: {
                id: 'attendee-id',
                userName: 'sara',
                image: null,
              },
              skill: {
                id: 'skill-id',
                name: 'JavaScript',
                description: 'Programming language',
              },
              swapRequest: {
                id: 'swap-id',
                status: 'ACCEPTED',
              },
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getMySessions(
    @CurrentUser() user: RequestUser,
    @Query() query: GetSessionsQueryDto,
  ) {
    return this.sessionService.getMySessions(user.id, query);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get calendar view (sessions grouped by date)' })
  @ApiOkResponse({
    description: 'Calendar retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          calendar: {
            '2026-02-10': [
              {
                id: 'session-id-1',
                title: 'JavaScript Session',
                scheduledAt: '2026-02-10T14:00:00.000Z',
                endsAt: '2026-02-10T15:30:00.000Z',
                status: 'SCHEDULED',
                host: { id: 'host-id', userName: 'john', image: null },
                attendee: {
                  id: 'attendee-id',
                  userName: 'sara',
                  image: null,
                },
                skill: { name: 'JavaScript' },
              },
            ],
            '2026-02-15': [
              {
                id: 'session-id-2',
                title: 'React Session',
                scheduledAt: '2026-02-15T10:00:00.000Z',
                endsAt: '2026-02-15T11:00:00.000Z',
                status: 'SCHEDULED',
                host: { id: 'host-id-2', userName: 'mike', image: null },
                attendee: {
                  id: 'attendee-id',
                  userName: 'sara',
                  image: null,
                },
                skill: { name: 'React' },
              },
            ],
          },
          totalSessions: 2,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getCalendar(
    @CurrentUser() user: RequestUser,
    @Query('month') month?: string,
  ) {
    return this.sessionService.getCalendar(user.id, month);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get session by ID' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiOkResponse({
    description: 'Session retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'session-id',
          title: 'JavaScript Session',
          description: 'Learning JavaScript from john',
          scheduledAt: '2026-02-10T14:00:00.000Z',
          endsAt: '2026-02-10T15:30:00.000Z',
          duration: 90,
          communication: 'TEXT_CHAT',
          virtualLink: null,
          status: 'SCHEDULED',
          reminderSent: false,
          notes: null,
          hostJoinedAt: null,
          attendeeJoinedAt: null,
          createdAt: '2026-02-05T20:00:00.000Z',
          updatedAt: '2026-02-05T20:00:00.000Z',
          host: {
            id: 'host-id',
            userName: 'john',
            image: null,
            bio: 'Developer',
            timezone: 'UTC',
          },
          attendee: {
            id: 'attendee-id',
            userName: 'sara',
            image: null,
            bio: 'Designer',
            timezone: 'UTC',
          },
          skill: {
            id: 'skill-id',
            name: 'JavaScript',
            description: 'Programming language',
            category: {
              name: 'Programming',
              icon: '💻',
            },
          },
          swapRequest: {
            id: 'swap-id',
            status: 'ACCEPTED',
            timezone: 'UTC',
          },
          conversation: {
            id: 'conversation-id',
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Session not found' })
  @ApiForbiddenResponse({
    description: 'You are not authorized to view this session',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getSessionById(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.sessionService.getSessionById(user.id, id);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark session as completed' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiOkResponse({
    description: 'Session marked as completed',
    schema: {
      example: {
        success: true,
        data: {
          id: 'session-id',
          status: 'COMPLETED',
          notes: 'Great session! Learned a lot.',
          updatedAt: '2026-02-10T16:00:00.000Z',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Session not found' })
  @ApiForbiddenResponse({
    description: 'You are not authorized to complete this session',
  })
  @ApiBadRequestResponse({
    description:
      'Only scheduled sessions can be completed or session has not started yet',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async completeSession(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CompleteSessionDto,
  ) {
    return this.sessionService.completeSession(user.id, id, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiOkResponse({
    description: 'Session cancelled successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'session-id',
          status: 'CANCELLED',
          notes: 'Unexpected work emergency',
          updatedAt: '2026-02-08T10:00:00.000Z',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Session not found' })
  @ApiForbiddenResponse({
    description: 'You are not authorized to cancel this session',
  })
  @ApiBadRequestResponse({
    description: 'Only scheduled sessions can be cancelled',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async cancelSession(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CancelSessionDto,
  ) {
    return this.sessionService.cancelSession(user.id, id, dto.reason);
  }

  // added summary session completed
  @Get(':id/summary')
  @ApiOperation({ summary: 'Get session summary after completion' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiOkResponse({
    description: 'Session summary retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          sessionId: 'session-id',
          sessionDuration: '1h 30m',
          totalSessions: 12,
          totalPoints: 100,
          gainedPoints: 10,
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Session not found' })
  @ApiForbiddenResponse({
    description: 'You are not authorized to view this session summary',
  })
  @ApiBadRequestResponse({
    description: 'Session is not completed yet',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async getSessionSummary(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return await this.sessionService.getSessionSummary(user.id, id);


  }

}
