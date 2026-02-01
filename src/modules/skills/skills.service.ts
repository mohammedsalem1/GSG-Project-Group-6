import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CategoryResponseDto, CategorySkillsDto, FilterSkillDto, PopularSkillResponseDto, SearchSkillDto, SearchUserSkillResponseDto, UserSkillDetailsResponseDto } from './dto/skills.dto';
import { Prisma } from '@prisma/client';
import { PaginatedResponseDto } from 'src/common/dto/pagination.dto';


@Injectable()
export class SkillsService {
   constructor(
      private readonly prismaService:PrismaService
   ) {}

   async getAllCategories():Promise<CategoryResponseDto[]> {
      return await this.prismaService.category.findMany({
        where:{isActive:true} ,
        select:{
            id:true , 
            name:true,
            icon:true,
            description:true
        }
      })
   }
   async getSkillsByCategory(categoryId:string): Promise<CategorySkillsDto> {
      const category = await this.prismaService.category.findUnique({
        where: {id:categoryId} , 
        select :{id:true , name:true, isActive:true ,  skills: {where:{isActive:true},select:{id:true , name: true , isActive:true}}}
      })
      
      if (!category || !category.isActive) {
          throw new NotFoundException('Not found Category')
      }
      if (category.skills.length === 0) {
          throw new NotFoundException('No skills found for this category');
      }
      return category
   }
   async searchSkills(query: SearchSkillDto): Promise<PaginatedResponseDto<SearchUserSkillResponseDto>>  {
  
      const searchName = query.name
      const pagination = this.prismaService.handleQueryPagination({
             page: query.page,
            limit: query.limit,
     });
      const whereClause: Prisma.UserSkillWhereInput = {
           user: { isActive: true },
           skill: { isActive: true },
        };
       if (searchName) {
         whereClause.OR = [
            {  skill: { name: { contains: searchName, mode: 'insensitive'}}},
            {  skill: { category: { name: { contains: searchName, mode: 'insensitive'}}}},];
       }

      const { page, ...removePage } = pagination;
      const [usersSkill, count] = await Promise.all([
      this.prismaService.userSkill.findMany({
        ...removePage,
        where:whereClause,
        select: this.getUserSkillSelect(),
    }),

      this.prismaService.userSkill.count({
       where: whereClause,
     }),
   ]);
  
      return {
         data: usersSkill.map((item) => {
         const { averageRating, totalReviews } = this.calculateAvgRating(item.user.reviewsReceived);

         return {
           skill: item.skill,
           user: {
             userName: item.user.userName,
             image: item.user.image,
             level:item.level,
             yearsOfExperience: item.yearsOfExperience,
             isOffering: item.isOffering,
             bio: item.user.bio,
             receivedSwaps: item.user._count.receivedSwaps,
             sentSwaps: item.user._count.sentSwaps,
             averageRating,
             totalReviews,
    },
  };
}),

    ...this.prismaService.formatPaginationResponse({
      page,
      count,
      limit: pagination.take,
    }),
  };
   }
   async filterSkills(query: FilterSkillDto): Promise<PaginatedResponseDto<SearchUserSkillResponseDto>> {

      const whereClause: Prisma.UserSkillWhereInput = {
         user: {  isActive: true,  ...(query.availability && { availability: query.availability })},
         ...(query.level && { level: query.level }),
         ...(query.isOffering !== undefined && { isOffering: query.isOffering }),

         skill: { isActive: true, ...(query.language && { language: { contains: query.language,mode: 'insensitive'},
    }),
  },
      };


       const pagination = this.prismaService.handleQueryPagination({
          page: query.page,
          limit: query.limit,
        });

        const { page, ...removePage } = pagination;

         const [usersSkill, count] = await Promise.all([
             this.prismaService.userSkill.findMany({
             ...removePage,
              where: whereClause,
               select: this.getUserSkillSelect(),
          }),

         this.prismaService.userSkill.count({where: whereClause}) ]);
  
          return {
            data: usersSkill.map((item) => {
            const { averageRating, totalReviews } = this.calculateAvgRating(item.user.reviewsReceived);

            return {
                skill: item.skill,
                user: {
                  userName: item.user.userName,
                  image: item.user.image,
                  level:item.level,
                  yearsOfExperience:item.yearsOfExperience,
                  bio: item.user.bio,
                  receivedSwaps: item.user._count.receivedSwaps,
                  sentSwaps: item.user._count.sentSwaps,
                  averageRating,
                  totalReviews,
            },
          };
        }),


            ...this.prismaService.formatPaginationResponse({
              page,
              count,
              limit: pagination.take,
            }),
          };
   }
   // TODO getSessions and add in details
   async getUserSkillDetails(skillId: string, userId: string):Promise<UserSkillDetailsResponseDto> {
  
      const userSkill = await this.prismaService.userSkill.findUnique({
          where: { userId_skillId: { userId, skillId } },
            select: {
              id: true,
              level: true,
              user: {
                select: {
                  userName: true,
                  bio: true,
                  image: true,
                  reviewsReceived: {
                    select: {
                      overallRating: true,
                    },
                  },
                },
              },
              skill: {
                select: {
                  name: true,
                  language: true,
                  description: true,
                  category: {
                    select: {
                      id: true,
                      name: true,
                      icon: true,
                      description: true,
                    },
                  },
                },
              },
              _count: {
                select: { reviews: true },
              },
              reviews: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                  overallRating: true,
                  comment: true,
                  reviewer: {
                    select: {
                      userName: true,
                      image: true,
                    },
                  },
                },
              },
              offeredInSwapRequests: {
                select: {
                  session: {
                    select: {
                      id: true,
                      title:true,
                      description: true,
                      duration: true,
                      createdAt:true
                    },
                  },
                },
              },
              requestedInSwapRequests: {
                select: {
                  session: {
                    select: {
                      id: true,
                      title:true,
                      description: true,
                      duration: true,
                      createdAt:true
                    },
                  },
                },
              },
            },
          });

      if (!userSkill) {
          throw new NotFoundException("the user don't have this skill");
       }

      const sessions = [
        ...userSkill.offeredInSwapRequests.map((s) => s.session).filter(Boolean),
        ...userSkill.requestedInSwapRequests.map((s) => s.session).filter(Boolean),
      ];

      const countSessions = sessions.length;
      const { averageRating, totalReviews } = this.calculateAvgRating(userSkill.user.reviewsReceived);

      return {
        provider: {
          userName: userSkill.user.userName,
          image: userSkill.user.image,
          bio: userSkill.user.bio,
          averageRating,
          totalReviews,
        },
        skill: userSkill.skill,
        level: userSkill.level,
        userSkillId:userSkill.id,
        reviews: {
          count: userSkill._count.reviews,
          LatestReviewDto: userSkill.reviews[0]
            ? {
                reviewerName: userSkill.reviews[0].reviewer.userName,
                reviewerImage: userSkill.reviews[0].reviewer.image,
                overallRating: userSkill.reviews[0].overallRating,
                comment: userSkill.reviews[0].comment,
              }
            : null,
        },
        sessions,
        countSessions,
      };
   }

   async getPopularSkill():Promise<PopularSkillResponseDto[]>{
     const skills = await this.prismaService.skill.findMany({
       select: {id:true , name:true , _count:{select:{users:true}}},
       orderBy: {users:{_count:'desc'}},
       take:20
     })

       if (skills.length === 0) {
          throw new NotFoundException('No skills found');
         }
       return skills.map((skill) => ({
           skill: {
              id: skill.id,
              name: skill.name,
            },
          usersCount:skill._count.users

     }))
   }

   
  
  async getRecommendedUserSkills(userId: string) {
     const ids = await this.getUserCategories(userId);
     if (!ids.length) {
           return [];
       }

      const usersSkill = await this.prismaService.userSkill.findMany({
        where: { userId: {  not: userId }, skill: { categoryId: { in: ids}}},
        select: this.getUserSkillSelect()
        })
      return {
    data: usersSkill.map((item) => {
    const { averageRating, totalReviews } = this.calculateAvgRating(item.user.reviewsReceived);

    return {
        skill: item.skill,
        user: {
           userName: item.user.userName,
           image: item.user.image,
           level:item.level,
           yearsOfExperience:item.yearsOfExperience,
           bio: item.user.bio,
           receivedSwaps: item.user._count.receivedSwaps,
           sentSwaps: item.user._count.sentSwaps,
           averageRating,
           totalReviews,
    },
  };
}),
 }}


  async getUserCategories(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { selectedCatIds: true }
    });
    if (!user) {
       throw new UnauthorizedException('the user in not authorized')       
    }
    const ids = user.selectedCatIds
      ? user.selectedCatIds.split(',').map(x => x.trim()).filter(Boolean)
      : [];

    return ids;
  }
  
   private getUserSkillSelect() {
     return {
          level:true,
          yearsOfExperience: true,
          isOffering: true,
          skill: {select: {name:true , language:true , description:true , 
             category: {select:{id:true ,name:true , icon:true , description:true}}}} ,
          user : {
            select : {
              userName: true , 
              image: true , 
              bio: true ,
              availability: true,
              reviewsReceived: {
                 select: {
                  overallRating: true,
                },
               }, 
              _count: {
                select: {
                  receivedSwaps: true,
                  sentSwaps: true,
                },
              },
            }
          }
   }}
    
  private ratingToNumber(rating: string): number {
   const ratingMap: Record<string, number> = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  };
  return ratingMap[rating] || 0;
  }

   private calculateAvgRating(reviews: { overallRating: string }[]) {
      const ratings = reviews.map(r => this.ratingToNumber(r.overallRating));
      const avg =
          ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

       return {
           averageRating: Math.round(avg * 10) / 10,
           totalReviews: ratings.length,
      };
 }
   
}

  

