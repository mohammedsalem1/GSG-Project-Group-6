/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateDisputeDto, GetDisputesQueryDto } from './dto';
import { ImageKitService } from '../user/services/imagekit.service';

@Injectable()
export class DisputeService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly imagekitService: ImageKitService,
  ) {}

  async createDispute(reporterId: string, dto: CreateDisputeDto) {
    // Validate session exists if provided
    if (dto.sessionId) {
      const session = await this.prismaService.session.findUnique({
        where: { id: dto.sessionId },
      });

      if (!session) {
        throw new NotFoundException('Session not found');
      }

      // Only session participants can report it
      if (session.hostId !== reporterId && session.attendeeId !== reporterId) {
        throw new ForbiddenException(
          'You are not a participant of this session',
        );
      }
    }

    // Check for duplicate active dispute on same session
    if (dto.sessionId) {
      const existingDispute = await this.prismaService.dispute.findFirst({
        where: {
          reporterId,
          sessionId: dto.sessionId,
          status: { in: ['PENDING', 'UNDER_REVIEW'] },
        },
      });

      if (existingDispute) {
        throw new BadRequestException(
          'You already have an active dispute for this session',
        );
      }
    }

    const dispute = await this.prismaService.dispute.create({
      data: {
        type: dto.type,
        description: dto.description,
        screenshot: dto.screenshot,
        sessionId: dto.sessionId,
        reporterId,
      },
      select: {
        id: true,
        type: true,
        description: true,
        screenshot: true,
        status: true,
        createdAt: true,
        session: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return dispute;
  }

  async uploadScreenshot(reporterId: string, file: Express.Multer.File) {
    const result = await this.imagekitService.uploadImage(file, 'disputes');
    return { url: result.url };
  }

  async getMyDisputes(reporterId: string, query: GetDisputesQueryDto) {
    const { status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { reporterId };
    if (status) where.status = status;

    const [disputes, total] = await Promise.all([
      this.prismaService.dispute.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          description: true,
          screenshot: true,
          status: true,
          adminNotes: true,
          createdAt: true,
          updatedAt: true,
          session: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      this.prismaService.dispute.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      disputes,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getDisputeById(reporterId: string, disputeId: string) {
    const dispute = await this.prismaService.dispute.findUnique({
      where: { id: disputeId },
      select: {
        id: true,
        type: true,
        description: true,
        screenshot: true,
        status: true,
        adminNotes: true,
        createdAt: true,
        updatedAt: true,
        reporter: {
          select: {
            id: true,
            userName: true,
            image: true,
          },
        },
        session: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    // Only the reporter can view their own dispute
    if (dispute.reporter.id !== reporterId) {
      throw new ForbiddenException(
        'You are not authorized to view this dispute',
      );
    }

    return dispute;
  }

  async cancelDispute(reporterId: string, disputeId: string) {
    const dispute = await this.prismaService.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.reporterId !== reporterId) {
      throw new ForbiddenException(
        'You are not authorized to cancel this dispute',
      );
    }

    if (dispute.status !== 'PENDING') {
      throw new BadRequestException('Only pending disputes can be cancelled');
    }

    const updated = await this.prismaService.dispute.update({
      where: { id: disputeId },
      data: { status: 'REJECTED' },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });

    return updated;
  }
}
