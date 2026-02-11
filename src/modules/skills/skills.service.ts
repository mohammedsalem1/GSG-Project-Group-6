import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import {
  CategoryResponseDto,
  CategorySkillsDto,
  FilterSkillDto,
  PopularSkillResponseDto,
  SearchSkillDto,
  SearchUserSkillResponseDto,
  SkillDto,
  UserSkillDetailsResponseDto,
} from './dto/skills.dto';
import { Prisma, Skill } from '@prisma/client';
import { PaginatedResponseDto } from 'src/common/dto/pagination.dto';
import { FeedbackService } from '../feedback/feedback.service';
import {
  AdminSkillsListResponseDto,
  AdminSkillListItemDto,
  AdminSkillDetailsDto,
  AdminSkillsQueryDto,
} from '../admin/dto/admin-skills.dto';

@Injectable()
export class SkillsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly feedbackService: FeedbackService,
  ) {}
  async findOrCreateSkill(name: string, description?: string, language?: string): Promise<{ skill: Skill; alreadyExists: boolean }> {
    let alreadyExists = true
    const category = await this.prismaService.category.findFirst({
      where: { name: 'Others', isActive: true },
    });
    if (!category) {
      throw new NotFoundException('Default category "Others" not found. Please create it first.');
    }

    let skill = await this.prismaService.skill.findFirst({
         where: { name: { equals: name.trim(), mode: 'insensitive' } },
    });
    if (!skill) {
      alreadyExists = false
      skill = await this.prismaService.skill.create({
        data: {
          name,
          description,
          language: language || 'English',
          categoryId: category.id,
          isActive: true,
        },
      });
    }

    return {skill , alreadyExists};
  }
  async getAllSkills(): Promise<SkillDto[]> {
    return this.prismaService.skill.findMany({ where: { isActive: true }, select:{id:true , name:true} })
  };
  async getAllCategories(): Promise<CategoryResponseDto[]> {
    return await this.prismaService.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        icon: true,
        description: true,
      },
    });
  }
  async getSkillsByCategory(categoryId: string): Promise<CategorySkillsDto> {
    const category = await this.prismaService.category.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
        isActive: true,
        skills: {
          where: { isActive: true },
          select: { id: true, name: true, isActive: true },
        },
      },
    });

    if (!category || !category.isActive) {
      throw new NotFoundException('Not found Category');
    }
    if (category.skills.length === 0) {
      throw new NotFoundException('No skills found for this category');
    }
    return category;
  }
  async autocomplete(name?: string) {
  if (!name) return [];

  return await this.prismaService.skill.findMany({
    where: {
      name: { contains: name.trim(), mode: 'insensitive' },
      isActive: true,
      },
      take: 10,
      select: {
        id: true,
        name: true,
      },
    });
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
            {  skill: { name: { contains: searchName , mode:'insensitive' }}},
            {  skill: { category: { name: { contains: searchName , mode:'insensitive' }}}},];
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
  
             const data: SearchUserSkillResponseDto[] = await Promise.all(
            usersSkill.map(async (item) => {
              const { rating, totalFeedbacks } = await this.feedbackService.getUserRating(item.user.id);

              return {
                skill: item.skill,
                user: {
                  userName: item.user.userName ?? '',
                  image: item.user.image,
                  level: item.level,
                  yearsOfExperience: item.yearsOfExperience,
                  bio: item.user.bio,
                  receivedSwaps: item.user._count.receivedSwaps,
                  sentSwaps: item.user._count.sentSwaps,
                  rating,
                  totalFeedbacks,
                },
              };
            }),
          );
          return {
              data,
              ...this.prismaService.formatPaginationResponse({ page,count, limit: pagination.take})
        };
   }
   async filterSkills(query: FilterSkillDto): Promise<PaginatedResponseDto<SearchUserSkillResponseDto>> {

      const whereClause: Prisma.UserSkillWhereInput = {
         user: {  isActive: true,  ...(query.availability && { availability: query.availability })},
         ...(query.level && { level: query.level }),
         ...(query.isOffering !== undefined && { isOffering: query.isOffering }),

         skill: { isActive: true, ...(query.language && { language: { contains: query.language }}),
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
  
         const data: SearchUserSkillResponseDto[] = await Promise.all(
            usersSkill.map(async (item) => {
              const { rating, totalFeedbacks } = await this.feedbackService.getUserRating(item.user.id);

              return {
                skill: item.skill,
                user: {
                  userName: item.user.userName ?? '',
                  image: item.user.image,
                  level: item.level,
                  yearsOfExperience: item.yearsOfExperience,
                  bio: item.user.bio,
                  receivedSwaps: item.user._count.receivedSwaps,
                  sentSwaps: item.user._count.sentSwaps,
                  rating,
                  totalFeedbacks,
                },
              };
            }),
          );
          return {
              data,
              ...this.prismaService.formatPaginationResponse({ page,count, limit: pagination.take})
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
      const { rating , totalFeedbacks } = await this.feedbackService.getUserRating(userId) ;
  return {
    provider: {
      userName: userSkill.user.userName ?? '',
      image: userSkill.user.image,
      bio: userSkill.user.bio,
      rating , 
      totalFeedbacks
    },
    skill: userSkill.skill,

    level: userSkill.level,
    userSkillId:userSkill.id,
    reviews: {
      count: userSkill._count.reviews,
      LatestReviewDto: userSkill.reviews[0]
        ? {
            reviewerName: userSkill.reviews[0].reviewer.userName ?? '',
            reviewerImage: userSkill.reviews[0].reviewer.image,
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
      const data: SearchUserSkillResponseDto[] = await Promise.all(
            usersSkill.map(async (item) => {
              const { rating, totalFeedbacks } = await this.feedbackService.getUserRating(item.user.id);

              return {
                skill: item.skill,
                user: {
                  userName: item.user.userName ?? '',
                  image: item.user.image,
                  level: item.level,
                  yearsOfExperience: item.yearsOfExperience,
                  bio: item.user.bio,
                  receivedSwaps: item.user._count.receivedSwaps,
                  sentSwaps: item.user._count.sentSwaps,
                  rating,
                  totalFeedbacks,
                },
              };
            }),
          );
          return {
              data,
          }
  }

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
          skill: {select: {id:true ,name:true , language:true , description:true , 
             category: {select:{id:true ,name:true , icon:true , description:true}}}} ,
          user : {
            select : {
              id:true,
              userName: true , 
              image: true , 
              bio: true ,
              availability: true,
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

  private calculateAvgRating(reviews: { overallRating: any }[]) {
    const ratings = reviews.map((r) => this.ratingToNumber(r.overallRating));
    const avg =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

    return {
      averageRating: Math.round(avg * 10) / 10,
      totalReviews: ratings.length,
    };
  }

  /**
   * Admin: Get all skills with pagination, filtering, and sorting
   */
  async getAllSkillsForAdmin(
    query: AdminSkillsQueryDto,
  ): Promise<AdminSkillsListResponseDto> {
    const { page = 1, limit = 10, search, sort = 'newest' } = query;

    const pagination = this.prismaService.handleQueryPagination({
      page,
      limit,
    });

    const whereClause: any = {
      isActive: true,
    };

    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' };
    }

    // Get skills with filtering
    const skills = await this.prismaService.skill.findMany({
      where: whereClause,
      include: {
        users: {
          where: { isOffering: true },
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                userName: true,
                image: true,
                bio: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: sort === 'newest' ? 'desc' : 'asc',
      },
      skip: pagination.skip,
      take: pagination.take,
    });

    // For each skill, get the request count and format the data
    const skillListItems: AdminSkillListItemDto[] = await Promise.all(
      skills.map(async (skill) => {
        // Get the provider (first user offering this skill)
        const offeringUserSkill = skill.users[0];

        const provider = offeringUserSkill
          ? {
              id: offeringUserSkill.user.id,
              userName: offeringUserSkill.user.userName ?? '',
              image: offeringUserSkill.user.image ?? '',
              bio: offeringUserSkill.user.bio ?? '',
            }
          : {
              id: '',
              userName: 'Unknown',
              image: null,
              bio: null,
              level: 'BEGINNER',
              sessionDuration: null,
            };

        // Count swap requests for this skill
        const requestsCount = await this.prismaService.swapRequest.count({
          where: {
            OR: [
              { offeredUserSkill: { skillId: skill.id } },
              { requestedUserSkill: { skillId: skill.id } },
            ],
          },
        });

        return {
          id: skill.id,
          name: skill.name,
          provider,
          requestsCount,
          createdAt: skill.createdAt,
        };
      }),
    );

    // Get total count
    const total = await this.prismaService.skill.count({ where: whereClause });

    return {
      data: skillListItems,
      total,
      page,
      limit,
    };
  }

  /**
   * Admin: Get detailed information about a specific skill
   */
  async getSkillDetailsForAdmin(
    skillId: string,
  ): Promise<AdminSkillDetailsDto> {
    const skill = await this.prismaService.skill.findUnique({
      where: { id: skillId },
      include: {
        users: {
          where: { isOffering: true },
          select: {
            userId: true,
            level: true,
            user: {
              select: {
                id: true,
                userName: true,
                image: true,
                bio: true,
              },
            },
            offeredInSwapRequests: {
              select: {
                session: {
                  select: {
                    duration: true,
                  },
                },
              },
              take: 1,
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!skill || !skill.isActive) {
      throw new NotFoundException('Skill not found');
    }

    // Get the provider (first user offering this skill)
    const offeringUserSkill = skill.users[0];

    const provider = offeringUserSkill
      ? {
          id: offeringUserSkill.user.id,
          userName: offeringUserSkill.user.userName ?? '',
          image: offeringUserSkill.user.image,
          bio: offeringUserSkill.user.bio,
          level: offeringUserSkill.level,
          sessionDuration:
            offeringUserSkill.offeredInSwapRequests[0]?.session?.duration ||
            null,
        }
      : {
          id: '',
          userName: 'Unknown',
          image: null,
          bio: null,
          level: 'BEGINNER',
          sessionDuration: null,
        };

    // Count swap requests for this skill
    const requestsCount = await this.prismaService.swapRequest.count({
      where: {
        OR: [
          { offeredUserSkill: { skillId: skill.id } },
          { requestedUserSkill: { skillId: skill.id } },
        ],
      },
    });

    return {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      category: skill.category.name,
      provider,
      language: skill.language,
      requestsCount,
      createdAt: skill.createdAt,
      updatedAt: new Date(),
    };
  }

  /**
   * Admin: Delete a skill (soft delete by setting isActive to false)
   */
  async deleteSkillForAdmin(skillId: string): Promise<{ message: string }> {
    const skill = await this.prismaService.skill.findUnique({
      where: { id: skillId },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    if (!skill.isActive) {
      throw new BadRequestException('Skill is already deleted');
    }

    await this.prismaService.skill.update({
      where: { id: skillId },
      data: { isActive: false },
    });

    return { message: 'Skill deleted successfully' };
  }
}
