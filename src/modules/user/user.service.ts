/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/user.dto';
import { PrismaService } from 'src/database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AddUserSkillDto, SearchUsersDto } from './dto';
import { FeedbackService } from '../feedback/feedback.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly feedbackService: FeedbackService,
  ) {}
  create(createUserDto: CreateUserDto) {
    return this.prismaService.user.create({
      data: {
        ...createUserDto,
        otpSendAt: createUserDto.otpSendAt || new Date(),
      },
    });
  }
  findUserByEmail(email: string) {
    return this.prismaService.user.findUnique({ where: { email } });
  }
  verifyUserEmail(email: string) {
    return this.prismaService.user.update({
      where: { email },
      data: {
        isVerified: true,
        otpCode: null,
        otpSendAt: null,
      },
    });
  }
    activateUserAfterReset(email: string) {
      return this.prismaService.user.update({
        where: { email },
        data: {
          otpCode: null,
          otpSendAt: null,
          isActive:true
        },
      });
  }

  updateOtp(hashedOtp: string, email: string) {
    return this.prismaService.user.update({
      where: { email },
      data: {
        otpCode: hashedOtp,
        otpSendAt: new Date(),
      },
    });
  }
  async updateOtpAndDeactivate(email: string, hashedOtp: string) {
    return this.prismaService.user.update({
      where: { email },
      data: {
        otpCode: hashedOtp,
        otpSendAt: new Date(),
        isActive: false,
      },
    });
}
  findUserByToken(token: string) {
    return this.prismaService.user.findFirst({
      where: {
        otpCode: token,
      },
    });
  }
  updatePasswordAndClearOtp(email: string, newPassword: string) {
    return this.prismaService.user.update({
      where: { email },
      data: {
        password: newPassword,
        otpCode: null,
        otpSendAt: null,
      },
    });
  }
  async updateUserSelectedCategories(userId: string, selectedCatIds: string[]) {
    const uniqueIds = [...new Set(selectedCatIds)];
    const categories = await this.prismaService.category.findMany({
      where: {
        id: { in: uniqueIds },
      },
      select: { id: true },
    });

    if (categories.length !== uniqueIds.length) {
      const foundIds = new Set(categories.map((c) => c.id));
      const notFoundIds = uniqueIds.filter((id) => !foundIds.has(id));

      throw new BadRequestException({
        message: 'Some category IDs were not found',
        notFoundIds,
      });
    }

    return this.prismaService.user.update({
      where: { id: userId },
      data: {
        selectedCatIds: uniqueIds.join(','),
      },
      select: {
        id: true,
        userName: true,
        selectedCatIds: true,
      },
    });
  }

  async findUserById(userId: string) {
    const user = await this.prismaService.user.findUnique({
         where: { id: userId },
         include: {
          hostedSessions: { where: { status: 'COMPLETED' } },
          attendedSessions: { where: { status: 'COMPLETED' } },
          badges: { include: { badge: true }}
         }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getCurrentUserProfile(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        userName: true,
        email: true,
        phoneNumber: true,
        role: true,
        bio: true,
        image: true,
        country: true,
        location: true,
        timezone: true,
        availability: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        skills: {
          select: {
            id: true,
            level: true,
            yearsOfExperience: true,
            isOffering: true,
            skill: {
              select: {
                id: true,
                name: true,
                description: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                    icon: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            sentSwaps: true,
            receivedSwaps: true,
            badges: true,
            reviewsGiven: true,
            reviewsReceived: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserProfile(userId: string, updateUserDto: UpdateUserDto) {
    // Check if user exists
    await this.findUserById(userId);

    // Update user
    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: updateUserDto,
      select: {
        id: true,
        userName: true,
        email: true,
        phoneNumber: true,
        bio: true,
        image: true,
        country: true,
        location: true,
        timezone: true,
        availability: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async updateProfileImage(userId: string, imageUrl: string | null) {
    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: { image: imageUrl },
      select: {
        id: true,
        userName: true,
        image: true,
      },
    });
    return updatedUser;
  }

  async addUserSkill(userId: string, addUserSkillDto: AddUserSkillDto) {
    const { skillId, level, yearsOfExperience, isOffering } = addUserSkillDto;

    // Check if skill exists
    const skill = await this.prismaService.skill.findUnique({
      where: { id: skillId },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    // Check for duplicate
    const existingUserSkill = await this.prismaService.userSkill.findFirst({
      where: {
        userId,
        skillId,
        isOffering,
      },
    });

    if (existingUserSkill) {
      throw new BadRequestException(
        `You already have this skill in your ${isOffering ? 'offered' : 'wanted'} skills`,
      );
    }

    // Create user skill
    const userSkill = await this.prismaService.userSkill.create({
      data: {
        userId,
        skillId,
        level,
        yearsOfExperience: yearsOfExperience || null,
        isOffering,
      },
      include: {
        skill: {
          include: {
            category: true,
          },
        },
      },
    });

    return userSkill;
  }

  async removeUserSkill(userId: string, skillId: string, isOffering: boolean) {
    const userSkill = await this.prismaService.userSkill.findFirst({
      where: {
        userId,
        skillId,
        isOffering,
      },
    });

    if (!userSkill) {
      throw new NotFoundException('User skill not found');
    }

    await this.prismaService.userSkill.delete({
      where: { id: userSkill.id },
    });

    return { message: 'Skill removed successfully' };
  }

  async getUserSkills(userId: string) {
    const skills = await this.prismaService.userSkill.findMany({
      where: { userId },
      include: {
        skill: {
          include: {
            category: true,
          },
        },
      },
      orderBy: [{ isOffering: 'desc' }, { createdAt: 'desc' }],
    });

    // Group by offering/wanted
    const offeredSkills = skills.filter((s) => s.isOffering);
    const wantedSkills = skills.filter((s) => !s.isOffering);

    return {
      offeredSkills,
      wantedSkills,
      total: skills.length,
    };
  }

  async getPublicUserProfile(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        userName: true,
        bio: true,
        image: true,
        country: true,
        location: true,
        timezone: true,
        availability: true,
        createdAt: true,

        // Include skills
        skills: {
          select: {
            id: true,
            level: true,
            yearsOfExperience: true,
            isOffering: true,
            skill: {
              select: {
                id: true,
                name: true,
                description: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                    icon: true,
                  },
                },
              },
            },
          },
        },

        // Include stats
        _count: {
          select: {
            sentSwaps: true,
            receivedSwaps: true,
            badges: true,
            reviewsGiven: true,
            reviewsReceived: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const ratingData = await this.feedbackService.getUserRating(userId);

    return {
      ...user,
      averageRating: ratingData.rating,
      totalFeedbacks: ratingData.totalFeedbacks,
    };
  }

  async searchUsers(searchDto: SearchUsersDto) {
    const {
      query,
      country,
      location,
      availability,
      skillName,
      skillLevel,
      page = 1,
      limit = 10,
    } = searchDto;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (query) {
      where.OR = [
        { userName: { contains: query } },
        { bio: { contains: query } },
        { location: { contains: query } },
      ];
    }

    if (country) {
      where.country = { contains: country };
    }

    if (location) {
      where.location = { contains: location };
    }

    if (availability) {
      where.availability = availability;
    }

    if (skillName || skillLevel) {
      where.skills = {
        some: {
          isOffering: true,
          ...(skillName && {
            skill: {
              name: { contains: skillName },
            },
          }),
          ...(skillLevel && { level: skillLevel }),
        },
      };
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prismaService.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          userName: true,
          bio: true,
          image: true,
          country: true,
          location: true,
          timezone: true,
          availability: true,
          createdAt: true,
          skills: {
            where: { isOffering: true },
            select: {
              id: true,
              level: true,
              yearsOfExperience: true,
              skill: {
                select: {
                  id: true,
                  name: true,
                  category: {
                    select: {
                      name: true,
                      icon: true,
                    },
                  },
                },
              },
            },
            take: 5,
          },
          _count: {
            select: {
              feedbackReceived: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prismaService.user.count({ where }),
    ]);

    // Add ratings to each user
    const usersWithRatings = await Promise.all(
      users.map(async (user) => {
        const ratingData = await this.feedbackService.getUserRating(user.id);
        return {
          ...user,
          averageRating: ratingData.rating,
          totalFeedbacks: ratingData.totalFeedbacks,
        };
      }),
    );

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      users: usersWithRatings,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };
  }

  /**
   * Get all users for admin (paginated). Keeps admin route but uses user service.
   */
  async findAllForAdmin(options: { page?: number; limit?: number } = {}) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prismaService.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          userName: true,
          email: true,
          role: true,
          image: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: {
              sentSwaps: true,
              receivedSwaps: true,
              hostedSessions: true,
              attendedSessions: true,
              reviewsReceived: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.user.count(),
    ]);
    const totalPages = Math.ceil(total / limit);
    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Count distinct users who had at least one completed session in the given period (for "Active Users").
   */
  async getActiveUsersCount(startDate: Date, endDate: Date): Promise<number> {
    const sessions = await this.prismaService.session.findMany({
      where: {
        status: 'COMPLETED',
        scheduledAt: { gte: startDate, lt: endDate },
      },
      select: { hostId: true, attendeeId: true },
    });
    const userIds = new Set<string>();
    sessions.forEach((s) => {
      userIds.add(s.hostId);
      userIds.add(s.attendeeId);
    });
    return userIds.size;
  }

  /**
   * Count users created in the given month.
   */
  async getNewUsersCount(year: number, month: number): Promise<number> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    return this.prismaService.user.count({
      where: { createdAt: { gte: start, lt: end } },
    });
  }

  /**
   * Users whose average review rating (from Review.overallRating) is above 3 in the period.
   */
  async getUsersRatedAbove3Count(year: number, month: number): Promise<number> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const reviews = await this.prismaService.review.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: { reviewedId: true, overallRating: true },
    });
    const ratingNum = (r: string | null) =>
      r === 'ONE' ? 1 : r === 'TWO' ? 2 : r === 'THREE' ? 3 : r === 'FOUR' ? 4 : r === 'FIVE' ? 5 : 0;
    const byUser: Record<string, number[]> = {};
    reviews.forEach((r) => {
      if (!byUser[r.reviewedId]) byUser[r.reviewedId] = [];
      byUser[r.reviewedId].push(ratingNum(r.overallRating));
    });
    return Object.keys(byUser).filter(
      (uid) =>
        byUser[uid].reduce((a, b) => a + b, 0) / byUser[uid].length > 3,
    ).length;
  }

  /**
   * Users whose average review rating is below 3.
   */
  async getUsersRatedBelow3Count(year: number, month: number): Promise<number> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const reviews = await this.prismaService.review.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: { reviewedId: true, overallRating: true },
    });
    const ratingNum = (r: string | null) =>
      r === 'ONE' ? 1 : r === 'TWO' ? 2 : r === 'THREE' ? 3 : r === 'FOUR' ? 4 : r === 'FIVE' ? 5 : 0;
    const byUser: Record<string, number[]> = {};
    reviews.forEach((r) => {
      if (!byUser[r.reviewedId]) byUser[r.reviewedId] = [];
      byUser[r.reviewedId].push(ratingNum(r.overallRating));
    });
    return Object.keys(byUser).filter((uid) => {
      const arr = byUser[uid];
      return arr.length > 0 && arr.reduce((a, b) => a + b, 0) / arr.length < 3;
    }).length;
  }

  /**
   * Users with more than one session cancellation in the month.
   */
  async getUsersWithMultipleCancellationsCount(
    year: number,
    month: number,
  ): Promise<number> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const cancelled = await this.prismaService.session.findMany({
      where: {
        status: 'CANCELLED',
        updatedAt: { gte: start, lt: end },
      },
      select: { hostId: true, attendeeId: true },
    });
    const countByUser: Record<string, number> = {};
    cancelled.forEach((s) => {
      [s.hostId, s.attendeeId].forEach((id) => {
        countByUser[id] = (countByUser[id] || 0) + 1;
      });
    });
    return Object.values(countByUser).filter((c) => c > 1).length;
  }

  /**
   * Count users who have at least one review flagged in the given month.
   */
  async getFlaggedUsersCountInMonth(
    year: number,
    month: number,
  ): Promise<number> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const flagged = await this.prismaService.review.findMany({
      where: {
        isFlagged: true,
        createdAt: { gte: start, lt: end },
      },
      select: { reviewedId: true },
      distinct: ['reviewedId'],
    });
    return flagged.length;
  }

  /**
   * Most active users by completed swap count in the month (top N).
   */
  async getMostActiveUsers(
    year: number,
    month: number,
    limit: number,
  ): Promise<{ userName: string; image: string | null; swaps: number }[]> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const completed = await this.prismaService.swapRequest.findMany({
      where: {
        status: 'COMPLETED',
        updatedAt: { gte: start, lt: end },
      },
      select: { requesterId: true, receiverId: true },
    });
    const countByUser: Record<string, number> = {};
    completed.forEach((s) => {
      countByUser[s.requesterId] = (countByUser[s.requesterId] || 0) + 1;
      countByUser[s.receiverId] = (countByUser[s.receiverId] || 0) + 1;
    });
    const sorted = Object.entries(countByUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
    if (sorted.length === 0) return [];
    const userIds = sorted.map(([id]) => id);
    const users = await this.prismaService.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, userName: true, image: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    return sorted.map(([id, swaps]) => ({
      userName: userMap.get(id)?.userName ?? 'Unknown',
      image: userMap.get(id)?.image ?? null,
      swaps,
    }));
  }
}
