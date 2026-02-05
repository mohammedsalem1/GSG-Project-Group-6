import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from 'src/common/types/user.types';
import { CreateReviewDto } from '../reviews/dto/create-review.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';


@ApiTags('feedbacks')
@Controller('feedback')
export class FeedbackController {

      constructor(private readonly feedbackService:FeedbackService){}
    
        @Post()
        @UseGuards(JwtAuthGuard)
        @ApiBearerAuth('JWT-auth')
        @HttpCode(HttpStatus.CREATED)
        @ApiOperation({ summary: 'Create a feedback for a completed session' })
        @ApiCreatedResponse({ description: 'create feedback successfully', 
            schema:{
                example:{
                    "success": true,
                    "data": {
                        "id": "a4310f30-a0a0-4ea8-b499-3543ab73d2a4",
                        "sessionId": "040bf31a-970a-43d2-8e48-4b4e9add969c",
                        "giverId": "395e7a32-7dc0-483b-b264-f6948a31d6b6",
                        "receiverId": "686d452f-ddf9-4b60-8164-391517bc0fe7",
                        "role": "GENERAL",
                        "sessionFocus": 4,
                        "activeParticipation": 4,
                        "learningFocus": 3,
                        "clarity": 3,
                        "patience": 3,
                        "sessionStructure": 3,
                        "communication": 3,
                        "strengths": "Great session!",
                        "improvements": "Great session!",
                        "createdAt": "2026-02-02T23:28:55.554Z"
                    }
                }
            }
        })
        @ApiInternalServerErrorResponse({ description: 'Internal server error' })
        @ApiUnauthorizedResponse({ description: 'Unauthorized' })
        @ApiBadRequestResponse({description:'session not completed, or review already exists'})
        async createReview(
            @Body() createFeedbackDto:CreateFeedbackDto,
            @CurrentUser() user: RequestUser,
            
        ) {
            return await this.feedbackService.createFeedback(createFeedbackDto , user.id)
        }


        @Get('rating/:userId')
        @UseGuards(JwtAuthGuard)
        @ApiBearerAuth('JWT-auth')
        @ApiOperation({ summary: 'Get profile rating for a user' })
        @ApiOkResponse({
            schema: {
            example: {
                success: true,
                data: {
                    rating: 3.2,
                    totalReviewers: 5,
                },
            },
            },
        })
         async getUserRating(@Param('userId') userId: string) {
          return await this.feedbackService.getUserRating(userId);
         }
}
