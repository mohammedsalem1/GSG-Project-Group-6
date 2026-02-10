import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { session } from 'passport';
import { Rating, SessionStatus } from '@prisma/client';
import { CreateReviewDto } from './dto/create-review.dto';
import { GetReviewsReceivedDto } from './dto/get-review-received.dto';
import { calculateAvgRating } from 'src/common/utils/rating.utils';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SwapsService } from '../swaps/swaps.service';

@Injectable()
export class ReviewsService {
    constructor(
      private readonly prismaService:PrismaService,
      private readonly swapsService:SwapsService
   ){}

    async createReview(createReviewDto:CreateReviewDto , reviewerId:string) {

       const swapRequest = await this.swapsService.getRequestById(reviewerId ,createReviewDto.swapRequestId)
       if (!swapRequest.session  || swapRequest.session!.status !== SessionStatus.COMPLETED ) {
          throw new BadRequestException("you don't review because the session is not completed")
       }
    

      const existingReview = await this.prismaService.review.findFirst({
           where: {  swapRequestId: createReviewDto.swapRequestId, reviewerId,
           },
        });

        if (existingReview) {
              throw new BadRequestException('You already reviewed this session');
          } 
       
       const reviewedId = swapRequest.requesterId === reviewerId ? swapRequest.receiverId : swapRequest.requesterId
       const userSkillId = swapRequest.requesterId === reviewerId ?
          swapRequest.requestedUserSkillId : swapRequest.offeredUserSkillId;
     
      return await this.prismaService.review.create({
            data :{
                swapRequestId:createReviewDto.swapRequestId,
                reviewedId,
                reviewerId,
                userSkillId,
                comment: createReviewDto.comment? createReviewDto.comment:null ,
                isPublic: createReviewDto.isPublic ?? true,
            } , 
              include: {
               reviewer: {
                  select: { id: true, userName: true, image: true }} ,
               reviewed: {
                  select: { id: true, userName: true, image: true }   
               },
               userSkill: {
                  select: { skill: true } 
               }
        }})
       
        
    }
    
   //  async getUserReviewsGiven(userId:string ,  query:getReviewsReceivedDto) {
   //     return await this.prismaService.review.findMany({
   //       where: {reviewedId:userId},
   //       include: {
   //         reviewed: { select: { id: true, userName: true, image: true } },
   //         userSkill: { select: { id: true, skill:true} },
   //         swapRequest: { select: { id: true, status: true } },
   //       },
   //      orderBy: { createdAt: 'desc' },

   //   })
   //  }
    async getUserSkillReviewsReceived(userId:string , query:GetReviewsReceivedDto) {
        // check userSkill is exist 
        const userSkill = await this.prismaService.userSkill.findFirst({
            where: {
               userId,
               skillId: query.skillId,
            },
         });
        if (!userSkill) {
           throw new NotFoundException('User does not have this skill')
        }
        const pagination = this.prismaService.handleQueryPagination({
           page: query.page,
           limit: query.limit,
        });

        const { page, ...removePage } = pagination;

        const reviewsForSkill = await this.prismaService.review.findMany({
          ...removePage,
         where: {
            reviewedId:userId,
            userSkillId:userSkill.id, 
            isVerified:true,
            isPublic: true,
         },
         select: {
            id:true,
            comment:true , 
            reviewer:{
               select: {
                  id:true,
                  userName:true,
                  image:true,
               }
            },
            userSkill:{
               select:{
                  skill:true            
               }
            }
         },
            orderBy: {
              createdAt: 'desc',
         },
        })
        const count  = await this.prismaService.review.count({
         where:{  
            reviewedId:userId,
            userSkillId:userSkill.id,
            isVerified:true,
            isPublic: true
         }})


      //   const avgRatingUserSkill = calculateAvgRating(ratingsArray)
      //   console.log(avgRatingUserSkill);

        return {
            review:reviewsForSkill , 
            // avgRatingUserSkill,
            ...this.prismaService.formatPaginationResponse({ page,count, limit: pagination.take})
         };
    }
    
    async getUserReviewsReceived(userId:string, query:PaginationDto) {
      const pagination = this.prismaService.handleQueryPagination({
           page: query.page,
           limit: query.limit,
        });

      const { page, ...removePage } = pagination;
      const reviews = await this.prismaService.review.findMany({ 
         ...removePage,
         where: { reviewedId: userId, isPublic: true, isVerified: true, },
         select:{
            id:true,
            comment:true , 
            reviewer:{
               select:{id:true, userName:true, image: true , bio:true}
            },
            userSkill:{select:{skill:true}}
         },
          orderBy: { createdAt: 'desc' }, 
      })
        if (!reviews.length) {
             return [];
         }
         const count  = await this.prismaService.review.count({where:{  
            reviewedId:userId,
          }})
         return {
            reviews,
            ...this.prismaService.formatPaginationResponse({ page,count, limit: pagination.take})
         }
    }
    async getReviewByReviewId(reviewId:string) {
      const reviewDetails = await this.prismaService.review.findUnique({
         where:{id:reviewId},
         include:{reviewer:{select:{id:true,userName:true,image:true}},userSkill:{include:{skill:true}} }, 
      })
      if (!reviewDetails) {
          throw new NotFoundException("we don't have review")
      }
      return reviewDetails
    }
    
    async flagReview(userId: string, reviewId: string) {
       const review = await this.prismaService.review.findFirst({
       where: {
         id: reviewId,
         reviewedId: userId,
       },
    });

       if (!review) {
           throw new NotFoundException('Review not found');
      }

      if (review.isFlagged) {
         return { message: 'Review already flagged' };
      }

      await this.prismaService.review.update({
         where: { id: reviewId },
         data: { isFlagged: true },
     });

      return { message: 'Review flagged successfully' };
}


}
