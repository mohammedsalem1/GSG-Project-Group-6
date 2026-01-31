import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { session } from 'passport';
import { Rating } from '@prisma/client';
import { CreateReviewDto } from './dto/create-review.dto';
import { GetReviewsReceivedDto } from './dto/get-review-received.dto';
import { calculateAvgRating } from 'src/common/utils/rating.utils';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class ReviewsService {
    constructor(private readonly prismaService:PrismaService){}

    async createReview(createReview:CreateReviewDto , reviewerId:string) {
       // check the SwapRequest is exist
       const swapRequest = await this.prismaService.swapRequest.findUnique({
        where:{id:createReview.swapRequestId},
        include: { session: true }
       })

       if (!swapRequest) {
          throw new BadRequestException('the swapRequest is not found')
       }

       if (!swapRequest.session  || swapRequest.session!.status !== 'COMPLETED' ) {
          throw new BadRequestException("you don't review because the session is not completed")
       }
    
       if (swapRequest.requesterId !== reviewerId && swapRequest.receiverId !== reviewerId) {
            throw new ForbiddenException('You are not part of this swap');
         }

        const existingReview = await this.prismaService.review.findFirst({
           where: {  swapRequestId: createReview.swapRequestId, reviewerId,
           },
        });

        if (existingReview) {
              throw new BadRequestException('You already reviewed this swap');
          } 
       
       const reviewedId = swapRequest.requesterId === reviewerId ? swapRequest.receiverId : swapRequest.requesterId
       const userSkillId = swapRequest.requesterId === reviewerId ?
        swapRequest.offeredUserSkillId : swapRequest.requestedUserSkillId;
        return await this.prismaService.review.create({
            data :{
                swapRequestId:createReview.swapRequestId,
                reviewedId,
                reviewerId,
                userSkillId,
                overallRating:this.numberToRating(createReview.overallRating),
                communicationRating:createReview.communicationRating ? this.numberToRating(createReview.communicationRating):null,
                punctualityRating:this.numberToRating(createReview.punctualityRating),
                 comment: createReview.comment? createReview.comment:null ,
            }
        })

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
        const existUserSkill = await this.prismaService.userSkill.findUnique({where:{id:query.userSkillId}})

        if (!existUserSkill) {
           throw new NotFoundException('the user Skill not found')
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
            userSkillId:query.userSkillId,
            isVerified:true
         },
         select: {
            id:true,
            comment:true , 
            overallRating:true,
            punctualityRating:true,
            communicationRating:true,
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
        const count  = await this.prismaService.review.count({where:{  
            reviewedId:userId,
            userSkillId:query.userSkillId,
            isVerified:true}})
        const ratingsArray = reviewsForSkill.map(r => ({
             overallRating: this.ratingToNumber(r.overallRating),
             communicationRating: this.ratingToNumber(r.communicationRating ?? ''),
             punctualityRating: this.ratingToNumber(r.punctualityRating),
         }));

        const avgRatingUserSkill = calculateAvgRating(ratingsArray)

        return {
            review:reviewsForSkill , 
            avgRatingUserSkill,
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
         where: { reviewedId:userId },
         select:{
            id:true,
            comment:true , 
            communicationRating:true,
            overallRating:true,
            punctualityRating:true,
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
    async getReview(reviewId:string) {
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
         reviewedId: userId, // المستخدم فقط يفلّغ reviews اللي وصلتله
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

    private  numberToRating = (value: number): Rating => {
      const ratingMap: Record<number, Rating> = {
        1: Rating.ONE,
        2: Rating.TWO,
        3: Rating.THREE,
        4: Rating.FOUR,
        5: Rating.FIVE,
    };
       return ratingMap[value] || 0;
  };
    private ratingToNumber = (rating: string): number => {
          const ratingMap: Record<string, number> = {
             ONE: 1,
             TWO: 2,
             THREE: 3,
             FOUR: 4,
             FIVE: 5,
      };
      return ratingMap[rating] || 0;
    };
}
