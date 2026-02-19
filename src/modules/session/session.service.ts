/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SessionStatus } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { CompleteSessionDto, GetSessionsQueryDto } from './dto';

@Injectable()
export class SessionService {
  constructor(private readonly prismaService: PrismaService , ) {}

  /**
   * Get user's sessions (as host or attendee)
   * Task 84: List all sessions with filters
   */
  async getMySessions(userId: string, query: GetSessionsQueryDto) {
    const where: any = {
      OR: [{ hostId: userId }, { attendeeId: userId }],
    };

    // Filter by status
    if (query.status) {
      where.status = query.status;
    }

    // Filter by month (YYYY-MM format)
    if (query.month) {
      const [year, month] = query.month.split('-');
      const startDate = new Date(`${year}-${month}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      where.scheduledAt = {
        gte: startDate,
        lt: endDate,
      };
    }

    const pagination = this.prismaService.handleQueryPagination(query);
    const { page, ...paginationArgs } = pagination;

    const [sessions, count] = await Promise.all([
      this.prismaService.session.findMany({
        ...paginationArgs,
        where,
        orderBy: { scheduledAt: 'asc' }, // Upcoming first
        include: {
          host: {
            select: {
              id: true,
              userName: true,
              image: true,
            },
          },
          attendee: {
            select: {
              id: true,
              userName: true,
              image: true,
            },
          },
          skill: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          swapRequest: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),
      this.prismaService.session.count({ where }),
    ]);

    return {
      data: sessions,
      ...this.prismaService.formatPaginationResponse({
        page,
        count,
        limit: pagination.take,
      }),
    };
  }

  /**
   * Get session by ID with full details
   * Task 85: View single session
   */
  async getSessionById(userId: string, sessionId: string) {
    const session = await this.prismaService.session.findUnique({
      where: { id: sessionId },
      include: {
        host: {
          select: {
            id: true,
            userName: true,
            image: true,
            bio: true,
            timezone: true,
          },
        },
        attendee: {
          select: {
            id: true,
            userName: true,
            image: true,
            bio: true,
            timezone: true,
          },
        },
        skill: {
          select: {
            id: true,
            name: true,
            description: true,
            category: {
              select: {
                name: true,
                icon: true,
              },
            },
          },
        },
        swapRequest: {
          select: {
            id: true,
            status: true,
            timezone: true,
          },
        },
        conversation: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Verify user is part of this session
    if (session.hostId !== userId && session.attendeeId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to view this session',
      );
    }

    return session;
  }

  /**
   * Get calendar view (sessions grouped by date)
   * Task 86: Simple calendar
   */
  async getCalendar(userId: string, month?: string) {
    const where: any = {
      OR: [{ hostId: userId }, { attendeeId: userId }],
      status: {
        in: [SessionStatus.SCHEDULED, SessionStatus.RESCHEDULED],
      },
    };

    // Filter by month if provided
    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = new Date(`${year}-${monthNum}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      where.scheduledAt = {
        gte: startDate,
        lt: endDate,
      };
    } else {
      // Default: current month
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      where.scheduledAt = {
        gte: startDate,
        lt: endDate,
      };
    }

    const sessions = await this.prismaService.session.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        host: {
          select: {
            id: true,
            userName: true,
            image: true,
          },
        },
        attendee: {
          select: {
            id: true,
            userName: true,
            image: true,
          },
        },
        skill: {
          select: {
            name: true,
          },
        },
      },
    });

    // Group by date
    const groupedByDate: Record<string, any[]> = {};

    sessions.forEach((session) => {
      const dateKey = session.scheduledAt.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(session);
    });

    return {
      calendar: groupedByDate,
      totalSessions: sessions.length,
    };
  }

  /**
   * Mark session as completed
   * Task 90: Complete session and trigger reviews
   */
  async completeSession(
    userId: string,
    sessionId: string,
    dto: CompleteSessionDto,
  ) {
    const session = await this.prismaService.session.findUnique({
      where: { id: sessionId },
      include: {
        swapRequest: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Only host or attendee can complete
    if (session.hostId !== userId && session.attendeeId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to complete this session',
      );
    }

    // Only scheduled or rescheduled sessions can be completed
    if (
      session.status !== SessionStatus.SCHEDULED &&
      session.status !== SessionStatus.RESCHEDULED
    ) {
      throw new BadRequestException('Only scheduled sessions can be completed');
    }

    // Session must be in the past
    const now = new Date();
    if (session.scheduledAt > now) {
      throw new BadRequestException(
        'Cannot complete a session that has not started yet',
      );
    }

    // Update session and swap request in transaction
    const result = await this.prismaService.$transaction(async (prisma) => {
      // 1. Update session status
      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.COMPLETED,
          notes: dto.notes || session.notes,
        },
      });

      // 2. Update swap request status
      await prisma.swapRequest.update({
        where: { id: session.swapRequestId },
        data: {
          status: 'COMPLETED',
        },
      });

      // 3. Award points to both users
      await Promise.all([
        prisma.point.create({
          data: {
            userId: session.hostId,
            amount: 50,
            reason: 'Completed session as host',
            type: 'EARNED',
          },
        }),
        prisma.point.create({
          data: {
            userId: session.attendeeId,
            amount: 50,
            reason: 'Completed session as attendee',
            type: 'EARNED',
          },
        }),
      ]);

      return updatedSession;
    });

    // 4. Send review request notifications
    const otherUserId =
      userId === session.hostId ? session.attendeeId : session.hostId;

    await this.prismaService.notification.create({
      data: {
        userId: otherUserId,
        type: 'REVIEW_REQUEST',
        title: 'Please review your session',
        message: 'Your session has been completed. Please leave a review!',
        data: { sessionId: session.id, swapRequestId: session.swapRequestId },
      },
    });

    return result;
  }

  /**
   * Cancel session
   * Task 89: Cancel session and notify
   */
  async cancelSession(userId: string, sessionId: string, reason?: string) {
    const session = await this.prismaService.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Only host or attendee can cancel
    if (session.hostId !== userId && session.attendeeId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to cancel this session',
      );
    }

    // Only scheduled or rescheduled sessions can be cancelled
    if (
      session.status !== SessionStatus.SCHEDULED &&
      session.status !== SessionStatus.RESCHEDULED
    ) {
      throw new BadRequestException('Only scheduled sessions can be cancelled');
    }

    // Update session status
    const updatedSession = await this.prismaService.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.CANCELLED,
        notes: reason || session.notes,
      },
    });

    // Notify the other user
    const otherUserId =
      userId === session.hostId ? session.attendeeId : session.hostId;

    await this.prismaService.notification.create({
      data: {
        userId: otherUserId,
        type: 'SYSTEM',
        title: 'Session cancelled',
        message: reason
          ? `Your session has been cancelled: ${reason}`
          : 'Your session has been cancelled',
        data: { sessionId: session.id },
      },
    });

    return updatedSession;
  }

  /**
   * Count completed sessions in the current week (for admin dashboard).
   */
  async getCompletedSessionsCountThisWeek(): Promise<number> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    return this.prismaService.session.count({
      where: {
        status: SessionStatus.COMPLETED,
        scheduledAt: { gte: startOfWeek, lt: endOfWeek },
      },
    });
  }

  /**
   * Completed sessions per day for a given month (for line chart).
   */
  async getCompletedSessionsByDay(
    year: number,
    month: number,
  ): Promise<{ day: number; count: number }[]> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const sessions = await this.prismaService.session.findMany({
      where: {
        status: SessionStatus.COMPLETED,
        scheduledAt: { gte: start, lt: end },
      },
      select: { scheduledAt: true },
    });
    const daysInMonth = new Date(year, month, 0).getDate();
    const byDay: Record<number, number> = {};
    for (let d = 1; d <= daysInMonth; d++) byDay[d] = 0;
    sessions.forEach((s) => {
      const d = s.scheduledAt.getDate();
      byDay[d] = (byDay[d] || 0) + 1;
    });
    return Object.entries(byDay).map(([day, count]) => ({
      day: Number(day),
      count,
    }));
  }

  /**
   * Requests vs sessions by week in the month (for bar chart).
   * Week1 = days 1-7, Week2 = 8-14, Week3 = 15-21, Week4 = 22-end.
   */
  async getRequestsVsSessionsByWeek(
    year: number,
    month: number,
  ): Promise<{ week: number; requests: number; sessions: number }[]> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const [requests, sessions] = await Promise.all([
      this.prismaService.swapRequest.findMany({
        where: {
          createdAt: { gte: start, lt: end },
        },
        select: { createdAt: true },
      }),
      this.prismaService.session.findMany({
        where: {
          status: SessionStatus.COMPLETED,
          scheduledAt: { gte: start, lt: end },
        },
        select: { scheduledAt: true },
      }),
    ]);

    const weekR: number[] = [0, 0, 0, 0];
    const weekS: number[] = [0, 0, 0, 0];
    requests.forEach((r) => {
      const d = r.createdAt.getDate();
      const w = Math.min(Math.floor((d - 1) / 7), 3);
      weekR[w]++;
    });
    sessions.forEach((s) => {
      const d = s.scheduledAt.getDate();
      const w = Math.min(Math.floor((d - 1) / 7), 3);
      weekS[w]++;
    });
    return [1, 2, 3, 4].map((week) => ({
      week,
      requests: weekR[week - 1] ?? 0,
      sessions: weekS[week - 1] ?? 0,
    }));
  }

  /**
   * Get all sessions for admin with filtering and pagination
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getAllSessionsForAdmin(query: any) {
    const where: any = {};

    // Filter by status
    if (query.status) {
      where.status = query.status;
    }

    // Filter by search (session ID, user name, or email)
    if (query.search) {
      where.OR = [
        { id: { contains: query.search, mode: 'insensitive' } },
        { host: { userName: { contains: query.search, mode: 'insensitive' } } },
        { host: { email: { contains: query.search, mode: 'insensitive' } } },
        {
          attendee: {
            userName: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          attendee: { email: { contains: query.search, mode: 'insensitive' } },
        },
      ];
    }

    // Filter by date range
    if (query.startDate || query.endDate) {
      where.scheduledAt = {};
      if (query.startDate) {
        const startDate = new Date(query.startDate);
        where.scheduledAt.gte = startDate;
      }
      if (query.endDate) {
        const endDate = new Date(query.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.scheduledAt.lte = endDate;
      }
    }

    const pagination = this.prismaService.handleQueryPagination(query);
    const { page, ...paginationArgs } = pagination;

    // Get week start for summary counts
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const [sessions, count, completedCount, cancelledCount, disputedCount] =
      await Promise.all([
        this.prismaService.session.findMany({
          where,
          include: {
            host: {
              select: {
                id: true,
                userName: true,
                image: true,
              },
            },
            attendee: {
              select: {
                id: true,
                userName: true,
                image: true,
              },
            },
            skill: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            scheduledAt: query.sort === 'oldest' ? 'asc' : 'desc',
          },
          ...paginationArgs,
        }),
        this.prismaService.session.count({ where }),
        this.prismaService.session.count({
          where: {
            status: 'COMPLETED',
            scheduledAt: { gte: weekStart, lt: weekEnd },
          },
        }),
        this.prismaService.session.count({
          where: {
            status: 'CANCELLED',
            scheduledAt: { gte: weekStart, lt: weekEnd },
          },
        }),
        // Disputed: sessions that were rescheduled (indicates issues)
        this.prismaService.session.count({
          where: {
            status: 'RESCHEDULED',
            scheduledAt: { gte: weekStart, lt: weekEnd },
          },
        }),
      ]);

    const data = sessions.map((session) => ({
      id: session.id,
      scheduledAt: session.scheduledAt,
      endsAt: session.endsAt,
      status: session.status,
      skillName: session.skill?.name || 'N/A',
      host: session.host,
      attendee: session.attendee,
      duration: session.duration,
    }));

    return {
      data,
      summary: {
        completed: completedCount,
        cancelled: cancelledCount,
        disputed: disputedCount,
      },
      total: count,
      page,
      limit: paginationArgs.take,
    };
  }

  /**
   * Export sessions as CSV
   */
  async exportSessionsAsCSV(sessionIds: string[]) {
    const sessions = await this.prismaService.session.findMany({
      where: {
        id: { in: sessionIds },
      },
      include: {
        host: {
          select: {
            id: true,
            userName: true,
          },
        },
        attendee: {
          select: {
            id: true,
            userName: true,
          },
        },
        skill: {
          select: {
            name: true,
          },
        },
      },
    });

    // CSV Header
    const headers = [
      'Session ID',
      'Scheduled At',
      'Ends At',
      'Status',
      'Skill',
      'Host',
      'Attendee',
      'Duration (minutes)',
      'Created At',
    ];

    // CSV Rows
    const rows = sessions.map((session) => [
      session.id,
      session.scheduledAt.toISOString(),
      session.endsAt.toISOString(),
      session.status,
      session.skill?.name || 'N/A',
      session.host.userName,
      session.attendee.userName,
      session.duration.toString(),
      session.createdAt.toISOString(),
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return Buffer.from(csvContent, 'utf-8');
  }


  
  /// added Summary session completed
  async getSessionSummary(userId: string, sessionId: string) {
  const session = await this.prismaService.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) throw new NotFoundException();
  if (session.status !== SessionStatus.COMPLETED)
    throw new BadRequestException();

  // 1️⃣ Duration
    const durationMinutes = Number(session.duration)
  console.log(durationMinutes)
    const hours = Math.floor(durationMinutes / 60);   // 1
  const minutes = durationMinutes % 60;  
 

  const formattedDuration = `${hours}h ${minutes}m`;

  // 2️⃣ Total sessions between both users
  const totalSessions = await this.prismaService.session.count({
    where: {
      status: SessionStatus.COMPLETED,
      OR: [
        {
          hostId: session.hostId,
          attendeeId: session.attendeeId,
        },
        {
          hostId: session.attendeeId,
          attendeeId: session.hostId,
        },
      ],
    },
  });

  // 3️⃣ Total points for this user
  const totalPoints = await this.prismaService.point.aggregate({
    where: { userId },
    _sum: { amount: true },
  });

  return {
    session:session.id,
    sessionDuration: formattedDuration,
    totalSessions,
    totalPoints: totalPoints._sum.amount || 0,
    gainedPoints: 50,
  };
}

}
