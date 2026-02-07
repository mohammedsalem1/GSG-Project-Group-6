import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { session } from 'passport';
import { PrismaService } from 'src/database/prisma.service';
import { SessionStatus } from '@prisma/client';

@Injectable()
export class FeedbackService {
  constructor(private readonly prismaService: PrismaService) {}

  async createFeedback(createFeedbackDto: CreateFeedbackDto, giverId: string) {
    // check the session is exist
    const session = await this.prismaService.session.findUnique({
      where: { id: createFeedbackDto.sessionId },
    });

    if (!session) {
      throw new BadRequestException('the session is not found');
    }

    if (session.status !== SessionStatus.COMPLETED) {
      throw new BadRequestException(
        "you don't feedback because the session is not completed",
      );
    }

    if (session.hostId !== giverId && session.attendeeId !== giverId) {
      throw new ForbiddenException('You are not part of this swap');
    }

    const existingFeedback = await this.prismaService.feedback.findFirst({
      where: { sessionId: createFeedbackDto.sessionId, giverId },
    });

    if (existingFeedback) {
      throw new BadRequestException(
        'You already gave feedback for this session',
      );
    }

    const receiverId =
      session.hostId === giverId ? session.attendeeId : session.hostId;
    const { sessionId, ...feedbackFields } = createFeedbackDto;

    return await this.prismaService.feedback.create({
      data: {
        sessionId: createFeedbackDto.sessionId,
        receiverId,
        giverId,
        ...feedbackFields,
      },
    });
  }

  async getUserRating(userId: string): Promise<{
    rating: number;
    totalFeedbacks: number;
    reciverId: string;
    reciverName: string;
    reciverImage: string;
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
        reciverId: user.id,
        reciverName: user.userName,
        reciverImage: user.image ?? '',
        rating: 0,
        totalFeedbacks: 0,
      };
    }
    console.log(feedbacks);
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
        ].filter((v): v is number => typeof v === 'number');

        if (scores.length === 0) return null;

        const sum = scores.reduce((a, b) => a + b, 0);
        return sum / scores.length;
      })
      .filter((v): v is number => v !== null);
    if (sessionRatings.length === 0) {
      return {
        reciverId: user.id,
        reciverName: user.userName,
        reciverImage: user.image ?? '',
        rating: 0,
        totalFeedbacks: 0,
      };
    }
    const finalRating =
      sessionRatings.reduce((a, b) => a + b, 0) / sessionRatings.length;
    return {
      reciverId: user.id,
      reciverName: user.userName,
      reciverImage: user.image ?? '',
      rating: Number(finalRating.toFixed(1)),
      totalFeedbacks: sessionRatings.length ?? 0,
    };
  }
}
