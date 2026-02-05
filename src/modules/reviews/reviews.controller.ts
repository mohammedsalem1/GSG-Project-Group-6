import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from 'src/common/types/user.types';
import { CreateReviewDto } from './dto/create-review.dto';
import { GetReviewsReceivedDto } from './dto/get-review-received.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';


@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
   

    constructor(private readonly reviewService:ReviewsService){}

    @Post('')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a review for a completed swap session' })
    @ApiCreatedResponse({ description: 'create reviews & Ratings successfully' , 
        schema: {
        example: {
            success: true,
            data: {
                "id": "d979cfc4-b2e0-4d0a-93cd-6f1f8c53f01e",
                "swapRequestId": "13524a22-1624-4303-908b-72617022ff80",
                "reviewerId": "395e7a32-7dc0-483b-b264-f6948a31d6b6",
                "reviewedId": "686d452f-ddf9-4b60-8164-391517bc0fe7",
                "userSkillId": "94c37a3f-d6ad-4633-b808-ebb243017348",
                "comment": "Great session!",
                "isVerified": true,
                "isFlagged": false,
                "createdAt": "2026-02-02T21:27:52.754Z",
                "updatedAt": "2026-02-02T21:27:52.754Z",
                "reviewer": {
                "id": "395e7a32-7dc0-483b-b264-f6948a31d6b6",
                "userName": "ahmed",
                "image": null
                },
                "reviewed": {
                "id": "686d452f-ddf9-4b60-8164-391517bc0fe7",
                "userName": "aseel",
                "image": null
                },
                "userSkill": {
                "skill": {
                    "id": "faa846ec-df6b-4dad-9671-12221c2928ce",
                    "name": "Ui-Ux",
                    "description": "Web developer",
                    "isActive": true,
                    "categoryId": "faf0de20-8478-46f4-81b9-3a2991967457",
                    "language": "English",
                    "createdAt": "2026-01-28T19:43:16.058Z"
                }
                }
            }
        }
    }})
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBadRequestResponse({description:'Swap request not found, session not completed, or review already exists'})
    async createReview(
        @Body() createReview:CreateReviewDto,
        @CurrentUser() user: RequestUser,
        
    ) {
        return await this.reviewService.createReview(createReview , user.id)
    }


    @Get('me/received')
    @ApiOperation({ summary: 'Get reviews received by a user'})
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOkResponse({ description: 'Reviews fetched successfully',schema:{
        example:{
            success: true,
            data: {
                "reviews": [
                {
                    "id": "37ffef88-3c0c-4dbc-8cf3-a9dacd7ddd01",
                    "comment": "Great session!",
                    "communicationRating": "FOUR",
                    "reviewer": {
                    "id": "686d452f-ddf9-4b60-8164-391517bc0fe7",
                    "userName": "aseel",
                    "image": null,
                    "bio": "I am a passionate web developer with 5 years of experience..."
                    },
                    "userSkill": {
                    "skill": {
                        "id": "faa846ec-df6b-4dad-9671-12221c2928ce",
                        "name": "Ui-Ux",
                        "description": "Web developer",
                        "isActive": true,
                        "categoryId": "faf0de20-8478-46f4-81b9-3a2991967457",
                        "language": "English",
                        "createdAt": "2026-01-28T19:43:16.058Z"
                    }
                    }
                }
                ],
                "total": 1,
                "page": 1,
                "limit": 10,
                "totalPages": 1
            }
        }
    } })
    @ApiNotFoundResponse({ description: 'no reviews' })
    @HttpCode(HttpStatus.OK)
    async getUserReviewsReceived(
        @CurrentUser() user: RequestUser,
        @Query() query:PaginationDto

    ) {
       return this.reviewService.getUserReviewsReceived(user.id , query)
    } 


    @Get(':userId/received') 
    @ApiOperation({ summary: 'Get reviews received by a user for a specific skill'})
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOkResponse({ description: 'Reviews fetched successfully',
          schema:{
            example:{
                success: true,    
                data: {
                    "review": [
                    {
                        "id": "37ffef88-3c0c-4dbc-8cf3-a9dacd7ddd01",
                        "comment": "Great session!",
                        "overallRating": "FIVE",
                        "reviewer": {
                        "id": "686d452f-ddf9-4b60-8164-391517bc0fe7",
                        "userName": "aseel",
                        "image": null
                        },
                        "userSkill": {
                        "skill": {
                            "id": "faa846ec-df6b-4dad-9671-12221c2928ce",
                            "name": "Ui-Ux",
                            "description": "Web developer",
                            "isActive": true,
                            "categoryId": "faf0de20-8478-46f4-81b9-3a2991967457",
                            "language": "English",
                            "createdAt": "2026-01-28T19:43:16.058Z"
                        }
                        }
                    }
                    ],
                    "avgRatingUserSkill": {
                    "reviewCount": 1
                    },
                    "total": 1,
                    "page": 1,
                    "limit": 10,
                    "totalPages": 1
                }
            } 
        }
     })
    @ApiNotFoundResponse({ description: 'User skill has no review' })
    @HttpCode(HttpStatus.OK)
    @ApiQuery({ name: 'skillId', description: 'Skill ID to filter reviews', required: true })
    async getUserSkillReviewsReceived(
        @Param('userId') userId:string,
        @Query() query:GetReviewsReceivedDto
    ) {
        return this.reviewService.getUserSkillReviewsReceived(userId , query)
    }


    @Get(':reviewId')
    @ApiOperation({ summary: 'Get details review'})
    @ApiOkResponse({ description: 'Reviews fetched successfully' , 
        schema:{
            example:{
                success: true,
                data: {
                    "id": "d979cfc4-b2e0-4d0a-93cd-6f1f8c53f01e",
                    "swapRequestId": "13524a22-1624-4303-908b-72617022ff80",
                    "reviewerId": "395e7a32-7dc0-483b-b264-f6948a31d6b6",
                    "reviewedId": "686d452f-ddf9-4b60-8164-391517bc0fe7",
                    "userSkillId": "94c37a3f-d6ad-4633-b808-ebb243017348",
                    "overallRating": "FIVE",
                    "comment": "Great session!",
                    "isVerified": true,
                    "isFlagged": false,
                    "createdAt": "2026-02-02T21:27:52.754Z",
                    "updatedAt": "2026-02-02T21:27:52.754Z",
                    "reviewer": {
                    "id": "395e7a32-7dc0-483b-b264-f6948a31d6b6",
                    "userName": "ahmed",
                    "image": null
                    },
                    "userSkill": {
                    "id": "94c37a3f-d6ad-4633-b808-ebb243017348",
                    "userId": "686d452f-ddf9-4b60-8164-391517bc0fe7",
                    "skillId": "faa846ec-df6b-4dad-9671-12221c2928ce",
                    "level": "INTERMEDIATE",
                    "yearsOfExperience": 3,
                    "isOffering": true,
                    "createdAt": "2026-01-31T22:08:50.956Z",
                    "updatedAt": "2026-01-31T22:08:50.956Z",
                    "skill": {
                        "id": "faa846ec-df6b-4dad-9671-12221c2928ce",
                        "name": "Ui-Ux",
                        "description": "Web developer",
                        "isActive": true,
                        "categoryId": "faf0de20-8478-46f4-81b9-3a2991967457",
                        "language": "English",
                        "createdAt": "2026-01-28T19:43:16.058Z"
                    }
                    }
                }
            }
        } })
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiNotFoundResponse({description:"we don't have review"})    
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    async getReviewByReviewId(
       @Param('reviewId') reviewId:string,
    ) {
         return this.reviewService.getReviewByReviewId(reviewId)
    }

    @Patch(':reviewId/flag')
    @ApiOperation({ summary: 'Flag a received review' })
    @ApiOkResponse({ description: 'Reviews fetched successfully',
        schema:{
            example:{
                success:true,
                message: 'Review flagged successfully'
            }
        }
    })

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiNotFoundResponse({ description: 'Review not found' })
    @HttpCode(HttpStatus.OK)
    async flagReview(
      @CurrentUser() user: RequestUser,
      @Param('reviewId') reviewId: string,
    ) {
        return this.reviewService.flagReview(user.id, reviewId);
     }
  }

