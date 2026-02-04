import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationType, SwapStatus } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { PaginatedResponseDto } from 'src/common/dto/pagination.dto';
import { CreateSwapRequestDto, SwapRequestsQueryDto } from './dto/swaps.dto';

@Injectable()
export class SwapsService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(SwapsService.name);

  async createSwapRequest(
    requesterId: string,
    dto: CreateSwapRequestDto,
  ) {
    if (requesterId === dto.receiverId) {
      throw new BadRequestException('You cannot send a swap request to yourself');
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
      throw new BadRequestException(
        'You do not offer the selected skill',
      );
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

    const swapRequest = await this.prismaService.swapRequest.create({
      data: {
        requesterId,
        receiverId: dto.receiverId,
        offeredUserSkillId: offeredUserSkill.id,
        requestedUserSkillId: requestedUserSkill.id,
        rejectionReason: null,
        expiresAt,
        date: dateOnly,
        startAt: dto.startAt,   // "HH:mm"
        endAt: dto.endAt,       // "HH:mm"
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
      throw new ForbiddenException('You are not allowed to access this request');
    }

    return request;
  }

  async acceptRequest(userId: string, requestId: string) {
    const request = await this.prismaService.swapRequest.findUnique({
      where: { id: requestId },
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

    const updated = await this.prismaService.swapRequest.update({
      where: { id: requestId },
      data: { status: SwapStatus.ACCEPTED },
    });

    await this.prismaService.notification.create({
      data: {
        userId: request.requesterId,
        type: NotificationType.SWAP_ACCEPTED,
        title: 'Swap request accepted',
        message: 'Your swap request has been accepted',
        data: { swapRequestId: updated.id },
      },
    });

    return updated;
  }

  async rejectRequest(userId: string, requestId: string, reason?: string) {
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
        status: SwapStatus.REJECTED,
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
      throw new ForbiddenException('Only the requester can cancel this request');
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
          status: SwapStatus.REJECTED,
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
}
