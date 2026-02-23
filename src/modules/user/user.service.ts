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
import { Badge, RestrictionType } from '@prisma/client';
import { UpdateUserSkillDto } from './dto/update-user-skill.dto';
import { GamificationService } from '../gamification/gamification.service';
import { UserListQueryDto } from '../admin/dto/admin-user-list.dto';

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
    clearOtp(email: string) {
      return this.prismaService.user.update({
        where: { email },
        data: {
          otpCode: null,
          otpSendAt: null,
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
        badges:true,
        skills: {
          select: {
            id: true,
            level: true,
            yearsOfExperience: true,
            sessionLanguage:true,
            skillDescription:true, 
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
    const { skillId, level, yearsOfExperience, sessionLanguage , skillDescription} = addUserSkillDto;
    const isOffering = true
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
        isActive:true
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
        sessionLanguage,
        skillDescription,
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

  // async removeUserSkill(userId: string, skillId: string, isOffering: boolean) {
  //   const userSkill = await this.prismaService.userSkill.findFirst({
  //     where: {
  //       userId,
  //       skillId,
  //       isOffering,
  //     },
  //   });

  //   if (!userSkill) {
  //     throw new NotFoundException('User skill not found');
  //   }

  //   await this.prismaService.userSkill.delete({
  //     where: { id: userSkill.id },
  //   });

  //   return { message: 'Skill removed successfully' };
  // }
  async removeUserSkill(userId: string, skillId: string, isOffering: boolean) {
  const userSkill = await this.prismaService.userSkill.findFirst({
    where: {
      userId,
      skillId,
      isOffering,
      isActive: true, 
    },
  });

  if (!userSkill) {
    throw new NotFoundException('User skill not found or already removed');
  }

  await this.prismaService.userSkill.update({
    where: { id: userSkill.id },
    data: { isActive: false },
  });

  return { message: 'Skill removed successfully (soft delete)' };
}
 

  async getUserSkills(userId: string) {
    const skills = await this.prismaService.userSkill.findMany({
      where: { userId, isActive: true },
      include: {
        skill:true
      },
      orderBy: [{ isOffering: 'desc' }, { createdAt: 'desc' }],
    });

    // Group by offering/wanted
    const offeredSkills = skills.filter((s) => s.isOffering);
    // const wantedSkills = skills.filter((s) => !s.isOffering);

    return {
      offeredSkills,
      // wantedSkills,
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
            sessionLanguage:true,
            skillDescription:true,
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
        badges:true,
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


async updateUserSkill(userId: string, skillId: string, dto: UpdateUserSkillDto) {
  const userSkill = await this.prismaService.userSkill.findFirst({
    where: { userId, skillId, isActive: true },
  });

  if (!userSkill) {
    throw new NotFoundException('User skill not found');
  }

  const updated = await this.prismaService.userSkill.update({
    where: { id: userSkill.id },
    data: { ...dto },
    include: {
      skill: { include: { category: true } },
    },
  });

  return updated;
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

   // ===== Get current user status =====
    getUserCurrentStatus(
      user: {
        restrictions: {
          type: string;
          endAt: Date | null;
        }[];
      }
    ): 'ACTIVE' | 'SUSPENDED' | 'BANNED' {

      const now = new Date();

      const hasBan = user.restrictions.some(
        r => r.type === RestrictionType.BAN
      );

      const hasActiveSuspension = user.restrictions.some(
        r =>
          r.type === RestrictionType.SUSPENSION &&
          r.endAt &&
          r.endAt > now
      );

      if (hasBan) return 'BANNED';
      if (hasActiveSuspension) return 'SUSPENDED';
      return 'ACTIVE';
    }

  // ===== Generic function to add restriction =====
  private async addRestriction(
    userId: string,
    adminId: string,
    type: RestrictionType,
    reason?: string,
    endAt?: Date,
    externalNote?: string,
  ) {
    await this.findUserById(userId)
    
    const restriction = await this.prismaService.userRestriction.create({
      data: {
        userId,
        type,
        reason,
        endAt: endAt || null,
      },
    });

    await this.prismaService.auditLog.create({
      data: {
        adminId,
        action: 'CREATE',
        entity: 'UserRestriction',
        entityId: restriction.id,
        details: `Added ${type} to user`,
        metadata: externalNote ? { externalNote } : { oldStatus: 'UNKNOWN', newStatus: type },
      },
    });

    return restriction;
  }

  // ===== Actions =====
  async banUser(userId: string, adminId: string, reason?: string, endAt?: Date, externalNote?: string ) {
    return this.addRestriction(userId, adminId, RestrictionType.BAN, reason, endAt, externalNote);
  }

  async unbanUser( userId: string, adminId: string ) {
    const bans = await this.prismaService.userRestriction.findMany({
      where: { userId, type: 'BAN' },
    });

    for (const ban of bans) {
      await this.prismaService.userRestriction.delete({ where: { id: ban.id } });
      await this.prismaService.auditLog.create({
        data: {
          adminId,
          action: 'DELETE',
          entity: 'UserRestriction',
          entityId: ban.id,
          details: `Removed BAN from user`,
        },
      });
    }

    return { removed: bans.length };
  }

  async suspendUser(userId: string, adminId: string, reason?: string, endAt?: Date, externalNote?: string ) {
    return this.addRestriction(userId, adminId, RestrictionType.SUSPENSION, reason, endAt, externalNote);
  }

  async unsuspendUser(userId: string, adminId: string ) {
    const suspensions = await this.prismaService.userRestriction.findMany({
      where: { userId, type: 'SUSPENSION' },
    });

    for (const susp of suspensions) {
      await this.prismaService.userRestriction.delete({ where: { id: susp.id } });
      await this.prismaService.auditLog.create({
        data: {
          adminId,
          action: 'DELETE',
          entity: 'UserRestriction',
          entityId: susp.id,
          details: `Removed SUSPENSION from user`,
        },
      });
    }

    return { removed: suspensions.length };
  }

  async warnUser(userId: string, adminId: string, reason?: string, externalNote?: string ) {
    return this.addRestriction(userId, adminId, RestrictionType.WARNING, reason, undefined, externalNote);
  }

  async addAdminNote( userId: string, adminId: string,externalNote?: string ) {
    return this.prismaService.adminNote.create({
      data: {
        userId,
        adminId,
        externalNote,
      },
    });;
  }

  // ===== Get all users with optional filter =====
  async getUsersForAdmin(query: UserListQueryDto) {
      const { status, search, sort, page = 1, limit = 10 } = query;

      // 1️⃣ Fetch users matching search
      const users = await this.prismaService.user.findMany({
        where: search
          ? {
              OR: [
                { userName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
        select: {
          id: true,
          userName: true,
          email: true,
          restrictions: true,
          badges: {
            select: { badge: { select: { id: true, name: true, icon: true } } },
          },
        },
      });

      // 2️⃣ Get points
      const groupedPoints = await this.prismaService.point.groupBy({
        by: ['userId'],
        _sum: { amount: true },
      });
      const pointsMap = new Map(groupedPoints.map(p => [p.userId, p._sum.amount || 0]));

      // 3️⃣ Compute current status
      let result = users.map(user => {
        const currentStatus = this.getUserCurrentStatus(user);
        return {
          id: user.id,
          name: user.userName,
          email: user.email,
          status: currentStatus,
          points: pointsMap.get(user.id) || 0,
          badges: user.badges.map(b => ({
            id: b.badge.id,
            name: b.badge.name,
            icon: b.badge.icon,
          })),
        };
      });

      // 4️⃣ Filter by status AFTER computing current status
      if (status) {
        result = result.filter(u => u.status === status);
      }

      // 5️⃣ Pagination after filtering
      const total = result.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const paginatedUsers = result.slice(start, start + limit);

      return {
        users: paginatedUsers,
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

    async getUsersStats() {
      const users = await this.prismaService.user.findMany({
        select: {
          id: true,
          restrictions: true,
        },
      });

      let activeUsers = 0;
      let bannedUsers = 0;
      let suspendedUsers = 0;

      users.forEach(user => {
        const currentStatus = this.getUserCurrentStatus(user);

        if (currentStatus === 'ACTIVE') activeUsers++;
        else if (currentStatus === 'BANNED') bannedUsers++;
        else if (currentStatus === 'SUSPENDED') suspendedUsers++;
      });

      return {
        totalUsers: users.length,
        active: activeUsers,
        banned: bannedUsers,
        suspended: suspendedUsers,
      };
    }


    async getAdminNotesByUser(userId: string) {
      return await this.prismaService.adminNote.findMany({
      where: { userId },
      select: {
        adminId: true,
        externalNote: true,
        createdAt: true,
      },
    });
    }

        // get OverView User 
    async getOverviewUserForAdmin(userId: string) {
      const [profile, adminNotes] = await Promise.all([
        this.getPublicUserProfile(userId),
        this.getAdminNotesByUser(userId),
      ]);

      return {
        profile,
        adminNotes,
      };
    }
      
    // Get activity log for a user
  async getUserActivityLog(userId: string) {
    // 1️ Fetch all Admin Notes for the user
    const adminNotes = await this.prismaService.adminNote.findMany({
      where: { userId },
      select: {
        adminId: true,
        externalNote: true,
        createdAt: true,
      },
    });

    // 2️⃣ Fetch all User Restrictions for the user
    const restrictions = await this.prismaService.userRestriction.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,      // e.g., BANNED, SUSPENDED, WARNING
        reason: true,
        endAt: true,
        createdAt: true,
      },
    });

    const restrictionIds = restrictions.map(r => r.id);

    // 3️⃣ Fetch AuditLogs linked to these restrictions
    const restrictionLogs = await this.prismaService.auditLog.findMany({
      where: {
        entity: 'UserRestriction',
        entityId: { in: restrictionIds },
        action: 'CREATE', // only creation logs
      },
      select: {
        entityId: true,
        adminId: true,
        metadata: true,
        createdAt: true,
      },
    });

    // 4️⃣ Merge Admin Notes and Restrictions into a single activity array
    const activityLog = [
      // Map Admin Notes
      ...adminNotes.map(note => ({
        entity: 'AdminNote',
        type: 'ADMIN_NOTE',
        adminId: note.adminId,
        externalNote: note.externalNote,
        createdAt: note.createdAt,
      })),
      // Map User Restrictions + related audit log
      ...restrictionLogs.map(log => {
        const restriction = restrictions.find(r => r.id === log.entityId);
        if (!restriction) return null;

        return {
          entity: 'UserRestriction',
          type: restriction.type,
          adminId: log.adminId,
          reason: restriction.reason,
          endAt: restriction.endAt,
          metadata: log.metadata || null,
          createdAt: log.createdAt,
        };
      }).filter(Boolean), // remove nulls
    ];

    // 5️⃣ Sort activity by createdAt descending (latest first)
    activityLog.sort((a, b) => b!.createdAt.getTime() - a!.createdAt.getTime());

    return activityLog;
  }
  }

