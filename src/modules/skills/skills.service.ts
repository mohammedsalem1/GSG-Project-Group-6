import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CategoryResponseDto, CategorySkillsDto, FilterSkillDto, PopularSkillResponseDto, SearchSkillDto, SearchUserSkillResponseDto, UserSkillDetailsDto } from './dto/skills.dto';
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
        select :{id:true , name:true, isActive:true ,  skills: {where:{isActive:true},select:{id:true , name: true}}}
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
  
      const searchName = query.name.toLowerCase()
      const pagination = this.prismaService.handleQueryPagination({
             page: query.page,
            limit: query.limit,
     });
      const whereClause: Prisma.UserSkillWhereInput = { user: { isActive: true },skill: { isActive: true,
        OR: [
        { name: { contains: searchName } },
        { category: { name: { contains: searchName } } },
    ],
  },
};

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
    data: usersSkill.map((item) => ({
      skill: item.skill,
      user: {
        userName: item.user.userName,
        image: item.user.image,
        bio: item.user.bio,
        receivedSwaps: item.user._count.receivedSwaps,
        sentSwaps: item.user._count.sentSwaps,
      },
    })),

    ...this.prismaService.formatPaginationResponse({
      page,
      count,
      limit: pagination.take,
    }),
  };
   }
   async filterSkills(query: FilterSkillDto): Promise<PaginatedResponseDto<SearchUserSkillResponseDto>> {

  const whereClause: Prisma.UserSkillWhereInput = {
    user: {
      isActive: true,
      ...(query.availability && { availability: query.availability }),
    },
    ...(query.level && { level: query.level }),
    ...(query.isOffering !== undefined && { isOffering: query.isOffering }),
    ...(query.nameCategory && {
      skill: {
        category: {
          name: {
            contains: query.nameCategory.toLowerCase(),
          },
        },
      },
    }),
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

    this.prismaService.userSkill.count({
      where: whereClause,
    }),
  ]);
  
  return {
    data: usersSkill.map((item) => ({
      skill: item.skill,
      user: {
        userName: item.user.userName,
        image: item.user.image,
        bio: item.user.bio,
        receivedSwaps: item.user._count.receivedSwaps,
        sentSwaps: item.user._count.sentSwaps,
      },
    })),

    ...this.prismaService.formatPaginationResponse({
      page,
      count,
      limit: pagination.take,
    }),
  };
   }
   // TODO getSessions and add in details
   async getUserSkillDetails(skillId: string , userId:string): Promise<UserSkillDetailsDto> {

      const userSkill = await this.prismaService.userSkill.findUnique({
        where: { userId_skillId: { userId, skillId }},
        select: {
          id: true,
          level: true,
          user: {
            select: {
              userName: true,
              bio: true,
              image: true,
            }},
          skill:{
           select: {name:true , language:true , description:true , 
             category: {select:{id:true ,name:true , icon:true , description:true}}
          }},
          _count: {
            select:{reviews:true}
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
        },
      });
      if (!userSkill) {
         throw new BadRequestException("the user don't have this skill") 
      }
      // TODO make rating
      return this.mapUserSkillToResponse(userSkill)
   };
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


   private mapUserSkillToResponse(userSkill: any) {

      return {
         provider: {
           userName: userSkill.user.userName,
           image: userSkill.user.image,
           bio: userSkill.user.bio
         },
          skill: userSkill.skill,
          level: userSkill.level,
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
    };
   }
   private getUserSkillSelect() {
     return {
          skill: {select: {name:true , language:true , description:true , 
             category: {select:{id:true ,name:true , icon:true , description:true}}}} ,
          user : {
            select : {
              userName: true , 
              image: true , 
              bio: true , 
              _count: {
                select: {
                  receivedSwaps: true,
                  sentSwaps: true,
                },
              },
            }
          }
   }}
    
  
}
   

  //  async getRecommendedUserSkills() {}
   

