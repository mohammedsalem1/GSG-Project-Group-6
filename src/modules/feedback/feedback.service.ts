import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { session } from 'passport';
import { PrismaService } from 'src/database/prisma.service';
import { SessionStatus } from '@prisma/client';

@Injectable()
export class FeedbackService {
    constructor(private readonly prismaService:PrismaService){}
    
    async createFeedback(createFeedbackDto:CreateFeedbackDto , giverId:string) {
           // check the session is exist
           const session = await this.prismaService.session.findUnique({
            where:{id:createFeedbackDto.sessionId},
            include:{feedbacks:true},
           })
    
           if (!session) {
              throw new BadRequestException('the session is not found')
           }
    
           if (!session  || session.status !== SessionStatus.COMPLETED ) {
              throw new BadRequestException("you don't feedback because the session is not completed")
           }
        
           if (session.hostId !== giverId && session.attendeeId !== giverId) {
                throw new ForbiddenException('You are not part of this swap');
             }
    
            const existingFeedback = await this.prismaService.feedback.findFirst({
               where: {  sessionId: createFeedbackDto.sessionId, giverId,
               },
            });
    
            if (existingFeedback) {
                  throw new BadRequestException('You already feedback this session');
              } 
           
           const receiverId = session.hostId === giverId ? session.attendeeId : session.hostId;
          
            return await this.prismaService.feedback.create({
                data :{
                    sessionId:createFeedbackDto.sessionId,
                    receiverId,
                    giverId,
                    sessionFocus:createFeedbackDto.sessionFocus ?? null,
                    activeParticipation: createFeedbackDto.activeParticipation ?? null,
                    learningFocus: createFeedbackDto.learningFocus ?? null,
                    clarity: createFeedbackDto.clarity ?? null,
                    patience: createFeedbackDto.patience ?? null,
                    sessionStructure: createFeedbackDto.sessionStructure ?? null,
                    communication: createFeedbackDto.communication ?? null,
                    strengths: createFeedbackDto.strengths ?? null,
                    improvements: createFeedbackDto.improvements ?? null,
                }
            })
    
        }
}
