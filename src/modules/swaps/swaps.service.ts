/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  CommunicationType,
  NotificationType,
  SessionStatus,
  SwapStatus,
} from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { PaginatedResponseDto } from 'src/common/dto/pagination.dto';
import { CreateSwapRequestDto, SwapRequestsQueryDto } from './dto/swaps.dto';
import {
  AdminSwapsListResponseDto,
  AdminSwapsQueryDto,
} from '../admin/dto/admin-swaps.dto';

@Injectable()
export class SwapsService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(SwapsService.name);

  async createSwapRequest(requesterId: string, dto: CreateSwapRequestDto) {
    if (requesterId === dto.receiverId) {
      throw new BadRequestException(
        'You cannot send a swap request to yourself',
      );
    }

    const [offeredUserSkill, requestedUserSkill] = await Promise.all([
      this.prismaService.userSkill.findFirst({
        where: {
          userId: requesterId,
          skillId: dto.offeredSkillId,
          isOffering: true,
        },
      }),
      this.prismaService.userSkill.findFirst({
        where: {
          userId: dto.receiverId,
          skillId: dto.requestedSkillId,
          isOffering: true,
        },
      }),
    ]);

    if (!offeredUserSkill) {
      throw new BadRequestException('You do not offer the selected skill');
    }

    if (!requestedUserSkill) {
      throw new BadRequestException(
        'Receiver does not offer the requested skill',
      );
    }

    const duplicateRequest = await this.prismaService.swapRequest.findFirst({
      where: {
        requesterId,
        receiverId: dto.receiverId,
        offeredUserSkillId: offeredUserSkill.id,
        requestedUserSkillId: requestedUserSkill.id,
        status: { in: [SwapStatus.PENDING, SwapStatus.ACCEPTED] },
      },
    });

    if (duplicateRequest) {
      throw new BadRequestException('A similar active request already exists');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const dateOnly = new Date(`${dto.date}T00:00:00.000Z`);
    const startAt = new Date(
      `${dto.date}T${dto.startAt}:00${dto.timezone === 'UTC' ? 'Z' : ''}`,
    );
    const endAt = new Date(
      `${dto.date}T${dto.endAt}:00${dto.timezone === 'UTC' ? 'Z' : ''}`,
    );

    const swapRequest = await this.prismaService.swapRequest.create({
      data: {
        requesterId,
        receiverId: dto.receiverId,
        offeredUserSkillId: offeredUserSkill.id,
        requestedUserSkillId: requestedUserSkill.id,
        rejectionReason: null,
        expiresAt,
        date: dateOnly,
        startAt,
        endAt,
        timezone: dto.timezone ?? 'UTC',
      },
    });

    await this.prismaService.notification.create({
      data: {
        userId: dto.receiverId,
        type: NotificationType.SWAP_REQUEST,
        title: 'New swap request',
        message: 'You have received a new swap request',
        data: { swapRequestId: swapRequest.id },
      },
    });

    return swapRequest;
  }

  async getSentRequests(
    userId: string,
    query: SwapRequestsQueryDto,
  ): Promise<PaginatedResponseDto<any>> {
    const where = {
      requesterId: userId,
      ...(query.status ? { status: query.status } : {}),
    };

    const pagination = this.prismaService.handleQueryPagination(query);
    const { page, ...paginationArgs } = pagination;

    const [requests, count] = await Promise.all([
      this.prismaService.swapRequest.findMany({
        ...paginationArgs,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          receiver: {
            select: {
              id: true,
              userName: true,
              image: true,
            },
          },
          offeredUserSkill: {
            include: {
              skill: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  category: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          requestedUserSkill: {
            include: {
              skill: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  category: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prismaService.swapRequest.count({ where }),
    ]);

    return {
      data: requests,
      ...this.prismaService.formatPaginationResponse({
        page,
        count,
        limit: pagination.take,
      }),
    };
  }

  async getReceivedRequests(
    userId: string,
    query: SwapRequestsQueryDto,
  ): Promise<PaginatedResponseDto<any>> {
    const where = {
      receiverId: userId,
      ...(query.status ? { status: query.status } : {}),
    };

    const pagination = this.prismaService.handleQueryPagination(query);
    const { page, ...paginationArgs } = pagination;

    const [requests, count] = await Promise.all([
      this.prismaService.swapRequest.findMany({
        ...paginationArgs,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: {
            select: {
              id: true,
              userName: true,
              image: true,
            },
          },
          offeredUserSkill: {
            include: {
              skill: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  category: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          requestedUserSkill: {
            include: {
              skill: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  category: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prismaService.swapRequest.count({ where }),
    ]);

    return {
      data: requests,
      ...this.prismaService.formatPaginationResponse({
        page,
        count,
        limit: pagination.take,
      }),
    };
  }

  async getRequestById(userId: string, requestId: string) {
    const request = await this.prismaService.swapRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: {
          select: {
            id: true,
            userName: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            userName: true,
            image: true,
          },
        },
        offeredUserSkill: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                description: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        requestedUserSkill: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                description: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        conversation: {
          select: {
            id: true,
            isArchived: true,
          },
        },
        session: {
          select: {
            id: true,
            status: true,
            scheduledAt: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Swap request not found');
    }

    if (request.requesterId !== userId && request.receiverId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to access this request',
      );
    }

    return request;
  }

  async acceptRequest(userId: string, requestId: string) {
    const request = await this.prismaService.swapRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: true,
        receiver: true,
        offeredUserSkill: {
          include: {
            skill: true,
          },
        },
        requestedUserSkill: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Swap request not found');
    }

    if (request.receiverId !== userId) {
      throw new ForbiddenException('Only the receiver can accept this request');
    }

    if (request.status !== SwapStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be accepted');
    }

    // Validate session time is provided
    if (!request.date || !request.startAt || !request.endAt) {
      throw new BadRequestException(
        'Session time must be provided in the swap request',
      );
    }

    // Calculate duration in minutes
    const startTime = new Date(request.startAt);
    const endTime = new Date(request.endAt);
    const durationMinutes = Math.floor(
      (endTime.getTime() - startTime.getTime()) / (1000 * 60),
    );

    if (durationMinutes <= 0) {
      throw new BadRequestException('Invalid session duration');
    }

    // Use transaction to create everything atomically
    const result = await this.prismaService.$transaction(async (prisma) => {
      // 1. Update swap request status
      const updated = await prisma.swapRequest.update({
        where: { id: requestId },
        data: { status: SwapStatus.ACCEPTED },
      });

      // 2. Create conversation
      const conversation = await prisma.conversation.create({
        data: {
          user1Id: request.requesterId,
          user2Id: request.receiverId,
          swapRequestId: request.id,
        },
      });

      // 3. Create session
      const session = await prisma.session.create({
        data: {
          swapRequestId: request.id,
          conversationId: conversation.id,
          hostId: request.requesterId, // Requester is host
          attendeeId: request.receiverId, // Receiver is attendee
          skillId: request.requestedUserSkill.skillId, // Main skill being taught
          title: `${request.requestedUserSkill.skill.name} Session`,
          description: `Learning ${request.requestedUserSkill.skill.name} from ${request.requester.userName}`,
          scheduledAt: request.startAt,
          endsAt: request.endAt,
          duration: durationMinutes,
          communication: CommunicationType.TEXT_CHAT, // Default, can be changed later
          status: SessionStatus.SCHEDULED,
        },
      });

      return { updated, conversation, session };
    });

    // 4. Send notifications
    await Promise.all([
      this.prismaService.notification.create({
        data: {
          userId: request.requesterId,
          type: NotificationType.SWAP_ACCEPTED,
          title: 'Swap request accepted',
          message: 'Your swap request has been accepted',
          data: {
            swapRequestId: result.updated.id,
            sessionId: result.session.id,
          },
        },
      }),
      this.prismaService.notification.create({
        data: {
          userId: request.receiverId,
          type: NotificationType.SYSTEM,
          title: 'Session scheduled',
          message: `Your session is scheduled for ${new Date(request.startAt).toLocaleString()}`,
          data: { sessionId: result.session.id },
        },
      }),
    ]);

    return {
      ...result.updated,
      conversation: result.conversation,
      session: result.session,
    };
  }

  async declineRequest(userId: string, requestId: string, reason?: string) {
    const request = await this.prismaService.swapRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Swap request not found');
    }

    if (request.receiverId !== userId) {
      throw new ForbiddenException('Only the receiver can reject this request');
    }

    if (request.status !== SwapStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be rejected');
    }

    const updated = await this.prismaService.swapRequest.update({
      where: { id: requestId },
      data: {
        status: SwapStatus.DECLINED,
        rejectionReason: reason ?? null,
      },
    });

    await this.prismaService.notification.create({
      data: {
        userId: request.requesterId,
        type: NotificationType.SWAP_REJECTED,
        title: 'Swap request rejected',
        message: reason
          ? `Your swap request was rejected: ${reason}`
          : 'Your swap request was rejected',
        data: { swapRequestId: updated.id },
      },
    });

    return updated;
  }

  async cancelRequest(userId: string, requestId: string) {
    const request = await this.prismaService.swapRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Swap request not found');
    }

    if (request.requesterId !== userId) {
      throw new ForbiddenException(
        'Only the requester can cancel this request',
      );
    }

    if (
      request.status !== SwapStatus.PENDING &&
      request.status !== SwapStatus.ACCEPTED
    ) {
      throw new BadRequestException(
        'Only pending or accepted requests can be cancelled',
      );
    }

    const updated = await this.prismaService.swapRequest.update({
      where: { id: requestId },
      data: { status: SwapStatus.CANCELLED },
    });

    await this.prismaService.notification.create({
      data: {
        userId: request.receiverId,
        type: NotificationType.SYSTEM,
        title: 'Swap request cancelled',
        message: 'The swap request has been cancelled by the requester',
        data: { swapRequestId: updated.id },
      },
    });

    return updated;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expirePendingRequests() {
    const result = await this.prismaService.swapRequest.updateMany({
      where: {
        status: SwapStatus.PENDING,
        expiresAt: { lt: new Date() },
      },
      data: { status: SwapStatus.EXPIRED },
    });

    this.logger.log(`Expired swap requests: ${result.count}`);
  }

  async getStats(userId: string) {
    const [sentTotal, receivedTotal, accepted, rejected] = await Promise.all([
      this.prismaService.swapRequest.count({ where: { requesterId: userId } }),
      this.prismaService.swapRequest.count({ where: { receiverId: userId } }),
      this.prismaService.swapRequest.count({
        where: {
          OR: [{ requesterId: userId }, { receiverId: userId }],
          status: SwapStatus.ACCEPTED,
        },
      }),
      this.prismaService.swapRequest.count({
        where: {
          OR: [{ requesterId: userId }, { receiverId: userId }],
          status: SwapStatus.DECLINED,
        },
      }),
    ]);

    const totalDecisions = accepted + rejected;
    const acceptanceRate =
      totalDecisions === 0 ? 0 : Math.round((accepted / totalDecisions) * 100);

    return {
      sentTotal,
      receivedTotal,
      accepted,
      rejected,
      acceptanceRate,
    };
  }

  /**
   * Total completed swaps this week (for admin dashboard).
   */
  async getTotalSwapsCompletedThisWeek(): Promise<number> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    return this.prismaService.swapRequest.count({
      where: {
        status: SwapStatus.COMPLETED,
        updatedAt: { gte: startOfWeek, lt: endOfWeek },
      },
    });
  }

  /**
   * Top skills by swap count in the given month (for admin dashboard).
   */
  async getTopSkillsBySwapCount(
    year: number,
    month: number,
    limit: number,
  ): Promise<{ skillName: string; swaps: number; percentage: number }[]> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const completed = await this.prismaService.swapRequest.findMany({
      where: {
        status: SwapStatus.COMPLETED,
        updatedAt: { gte: start, lt: end },
      },
      include: {
        offeredUserSkill: {
          include: { skill: { select: { id: true, name: true } } },
        },
        requestedUserSkill: {
          include: { skill: { select: { id: true, name: true } } },
        },
      },
    });
    const countBySkill: Record<string, number> = {};
    let total = 0;
    completed.forEach((s) => {
      const offeredName = s.offeredUserSkill.skill.name;
      const requestedName = s.requestedUserSkill.skill.name;
      countBySkill[offeredName] = (countBySkill[offeredName] || 0) + 1;
      countBySkill[requestedName] = (countBySkill[requestedName] || 0) + 1;
      total += 2;
    });
    if (total === 0) {
      return [];
    }
    const sorted = Object.entries(countBySkill)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
    return sorted.map(([skillName, swaps]) => ({
      skillName,
      swaps,
      percentage: Math.round((swaps / total) * 100),
    }));
  }

  /**
   * Admin: Get all swaps with pagination, filtering, and sorting
   */
  async getAllSwapsForAdmin(
    query: AdminSwapsQueryDto,
  ): Promise<AdminSwapsListResponseDto> {
    const {
      page = 1,
      limit = 10,
      status,
      sort = 'newest',
      startDate,
      endDate,
    } = query;

    const pagination = this.prismaService.handleQueryPagination({
      page,
      limit,
    });

    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.createdAt = {
        gte: start,
        lte: end,
      };
    }

    // Get swaps with all related data
    const swaps = await this.prismaService.swapRequest.findMany({
      where: whereClause,
      include: {
        requester: {
          select: {
            id: true,
            userName: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            userName: true,
            image: true,
          },
        },
        offeredUserSkill: {
          select: {
            skill: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        requestedUserSkill: {
          select: {
            skill: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: sort === 'newest' ? 'desc' : 'asc',
      },
      skip: pagination.skip,
      take: pagination.take,
    });

    // Format swap data
    const data = swaps.map((swap) => ({
      id: swap.id,
      sender: {
        id: swap.requester.id,
        userName: swap.requester.userName,
        image: swap.requester.image,
      },
      receiver: {
        id: swap.receiver.id,
        userName: swap.receiver.userName,
        image: swap.receiver.image,
      },
      requestType: swap.message ? 'Free Session' : 'Skill Swap',
      requestedSkill: {
        id: swap.requestedUserSkill.skill.id,
        name: swap.requestedUserSkill.skill.name,
      },
      offeredSkill: swap.offeredUserSkill
        ? {
            id: swap.offeredUserSkill.skill.id,
            name: swap.offeredUserSkill.skill.name,
          }
        : null,
      status: swap.status,
      dateTime: swap.startAt,
    }));

    // Get summary counts
    const [acceptedCount, pendingCount, rejectedCount] = await Promise.all([
      this.prismaService.swapRequest.count({
        where: { status: 'ACCEPTED' },
      }),
      this.prismaService.swapRequest.count({
        where: { status: 'PENDING' },
      }),
      this.prismaService.swapRequest.count({
        where: { status: 'DECLINED' },
      }),
    ]);

    // Get total count
    const total = await this.prismaService.swapRequest.count({
      where: whereClause,
    });

    return {
      data,
      summary: {
        accepted: acceptedCount,
        pending: pendingCount,
        rejected: rejectedCount,
      },
      total,
      page,
      limit,
    };
  }

  /**
   * Admin: Export swaps as CSV
   */
  async exportSwapsAsCSV(swapIds: string[]) {
    const swaps = await this.prismaService.swapRequest.findMany({
      where: {
        id: { in: swapIds },
      },
      include: {
        requester: {
          select: {
            id: true,
            userName: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            userName: true,
            email: true,
          },
        },
        offeredUserSkill: {
          select: {
            skill: {
              select: {
                name: true,
              },
            },
          },
        },
        requestedUserSkill: {
          select: {
            skill: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Create CSV headers
    const headers = [
      'ID',
      'Sender',
      'Receiver',
      'Request Type',
      'Offered Skill',
      'Requested Skill',
      'Status',
      'Date',
      'Start Time',
      'End Time',
      'Timezone',
      'Created At',
    ];

    // Create CSV rows
    const rows = swaps.map((swap) => [
      swap.id,
      swap.requester.userName,
      swap.receiver.userName,
      swap.message ? 'Free Session' : 'Skill Swap',
      swap.offeredUserSkill?.skill?.name || '-',
      swap.requestedUserSkill?.skill?.name || '-',
      swap.status,
      swap.date.toISOString().split('T')[0],
      swap.startAt.toISOString().split('T')[1].substring(0, 5),
      swap.endAt.toISOString().split('T')[1].substring(0, 5),
      swap.timezone,
      swap.createdAt.toISOString(),
    ]);

    // Build CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return Buffer.from(csvContent, 'utf-8');
  }
}
