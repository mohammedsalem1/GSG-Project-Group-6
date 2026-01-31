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
    @ApiCreatedResponse({ description: 'create reviews & Ratings successfully'})
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBadRequestResponse({description:'Swap request not found, session not completed, or review already exists'})
    async createReview(
        @Body() createReview:CreateReviewDto,
        @CurrentUser() user: RequestUser,
        
    ) {
        return await this.reviewService.createReview(createReview , user.id)
    }

    @Get(':userId/received') 
    @ApiOperation({ summary: 'Get reviews received by a user for a specific skill'})
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOkResponse({ description: 'Reviews fetched successfully' })
    @ApiNotFoundResponse({ description: 'User skill has no review' })
    @HttpCode(HttpStatus.OK)
    @ApiQuery({name: 'userSkillId',description: 'userSkillId',required: true})


    async getUserSkillReviewsReceived(
        @Param('userId') userId:string,
        @Query() query:GetReviewsReceivedDto
    ) {
        return this.reviewService.getUserSkillReviewsReceived(userId , query)
    }

      

    @Get('me/received')
    @ApiOperation({ summary: 'Get reviews received by a user'})
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOkResponse({ description: 'Reviews fetched successfully' })
    @ApiNotFoundResponse({ description: 'no reviews' })
    @HttpCode(HttpStatus.OK)
    async getUserReviewsReceived(
        @CurrentUser() user: RequestUser,
        @Query() query:PaginationDto

    ) {
       return this.reviewService.getUserReviewsReceived(user.id , query)
    } 


    @Get(':reviewId')
    @ApiOperation({ summary: 'Get details review'})
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiNotFoundResponse({description:"we don't have review"})    
    async getOneReview(
       @Param('reviewId') reviewId:string,
    ) {
         return this.reviewService.getReview(reviewId)
    }

    @Patch(':reviewId/flag')
    @ApiOperation({ summary: 'Flag a received review' })
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

