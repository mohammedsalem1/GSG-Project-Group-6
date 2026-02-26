import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {  LearningFeedbackDto, TeachingFeedbackDto } from './dto/create-feedback.dto';
import { PrismaService } from 'src/database/prisma.service';
import { SessionStatus } from '@prisma/client';
import { SessionService } from '../session/session.service';

@Injectable()
export class FeedbackService {
  constructor(
      private readonly prismaService: PrismaService,
      private readonly sessionService: SessionService
    ) {}

  // async createFeedback(createFeedbackDto: CreateFeedbackDto, giverId: string) {

  //   const session = await this.sessionService.getSessionById(giverId,createFeedbackDto.sessionId)
  //   if (session.status !== SessionStatus.COMPLETED) {
  //     throw new BadRequestException(
  //       "you don't feedback because the session is not completed",
  //     );
  //   }

  //   const existingFeedback = await this.prismaService.feedback.findFirst({
  //     where: { sessionId: createFeedbackDto.sessionId, giverId },
  //   });

  //   if (existingFeedback) {
  //     throw new BadRequestException(
  //       'You already gave feedback for this session',
  //     );
  //   }

  //   const receiverId =
  //     session.hostId === giverId ? session.attendeeId : session.hostId;
  //   const { sessionId, ...feedbackFields } = createFeedbackDto;

  //   return await this.prismaService.feedback.create({
  //     data: {
  //       sessionId: createFeedbackDto.sessionId,
  //       receiverId,
  //       giverId,
  //       ...feedbackFields,
  //     },
  //   });
  // }
  async createFeedback(dto: TeachingFeedbackDto | LearningFeedbackDto, giverId: string, role: 'TEACHING' | 'LEARNING') {
  const session = await this.sessionService.getSessionById(giverId, dto.sessionId);
  if (session.status !== 'COMPLETED') {
    throw new BadRequestException("Session is not completed");
  }

  const existingFeedback = await this.prismaService.feedback.findFirst({
    where: { sessionId: dto.sessionId, giverId , role},
  });
  if (existingFeedback) {
    throw new BadRequestException("You already gave feedback for this session");
  }

  const receiverId = session.hostId === giverId ? session.attendeeId : session.hostId;
  const { sessionId, ...feedbackFields } = dto;

  const feedbackData: any = { sessionId, receiverId, giverId, role };
  for (const [key, value] of Object.entries(feedbackFields)) {
    if (value !== undefined && value !== null) {
      feedbackData[key] = value;
    }
  }

  return this.prismaService.feedback.create({ data: feedbackData });
}
  async getUserRating(userId: string): Promise<{
    rating: number;
    totalFeedbacks: number;
    receiverId: string;
    receiverName: string;
    receiverImage: string;
  }> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException('the user is not found');
    }
    const feedbacks = await this.prismaService.feedback.findMany({
      where: {
        receiverId: userId,
      },
    });

    if (feedbacks.length === 0) {
      return {
        receiverId: user.id,
        receiverName: user.userName ?? '',
        receiverImage: user.image ?? '',
        rating: 0,
        totalFeedbacks: 0,
      };
    }
    const sessionRatings = feedbacks
      .map((feedback) => {
        const scores = [
          feedback.onTime !== undefined ? (feedback.onTime ? 5 : 1) : undefined,
          feedback.sessionFocus,
          feedback.activeParticipation,
          feedback.learningFocus,
          feedback.clarity,
          feedback.patience,
          feedback.sessionStructure,
          feedback.communication,
          feedback.openToFeedback,
        ].filter((v): v is number => typeof v === 'number' && v !== 0);

        if (scores.length === 0) return null;

        const sum = scores.reduce((a, b) => a + b, 0);
        return sum / scores.length;
      })
      .filter((v): v is number => v !== null);
    if (sessionRatings.length === 0) {
      return {
        receiverId: user.id,
        receiverName: user.userName?? '',
        receiverImage: user.image ?? '',
        rating: 0,
        totalFeedbacks: 0,
      };
    }
    const finalRating =
      sessionRatings.reduce((a, b) => a + b, 0) / sessionRatings.length;
    return {
      receiverId: user.id,
      receiverName: user.userName?? '',
      receiverImage: user.image ?? '',
      rating: Number(finalRating.toFixed(1)),
      totalFeedbacks: sessionRatings.length ?? 0,
    };
  }
              
    /**
     * Count feedbacks submitted this week (for admin dashboard "Weekly Reports").
     */
    async getWeeklyReportsCount(): Promise<number> {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      return this.prismaService.feedback.count({
        where: {
          createdAt: { gte: startOfWeek, lt: endOfWeek },
        },
      });
    }
}
