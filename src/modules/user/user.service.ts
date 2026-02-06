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

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}
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

        // Include feedbacks received (for calculating rating)
        feedbackReceived: {
          select: {
            sessionFocus: true,
            activeParticipation: true,
            learningFocus: true,
            clarity: true,
            patience: true,
            sessionStructure: true,
            communication: true,
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

    // Calculate average rating from feedback
    let totalRating = 0;
    let ratingCount = 0;

    user.feedbackReceived.forEach((feedback) => {
      // Collect all non-null rating fields
      const ratings = [
        feedback.sessionFocus,
        feedback.activeParticipation,
        feedback.learningFocus,
        feedback.clarity,
        feedback.patience,
        feedback.sessionStructure,
        feedback.communication,
      ].filter((rating) => rating !== null); // Only count non-null ratings

      ratings.forEach((rating) => {
        totalRating += rating;
        ratingCount++;
      });
    });

    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

    // Remove feedbackReceived array, return only the average
    const { feedbackReceived, ...userWithoutFeedback } = user;

    return {
      ...userWithoutFeedback,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalFeedbacks: user.feedbackReceived.length,
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
      isActive: true, // Only show active users
    };

    // Text search in username, bio, location
    if (query) {
      where.OR = [
        { userName: { contains: query } },
        { bio: { contains: query } },
        { location: { contains: query } },
      ];
    }

    // Filter by country
    if (country) {
      where.country = { contains: country };
    }

    // Filter by location
    if (location) {
      where.location = { contains: location };
    }

    // Filter by availability
    if (availability) {
      where.availability = availability;
    }

    // Filter by skill
    if (skillName || skillLevel) {
      where.skills = {
        some: {
          isOffering: true, // Only search offered skills
          ...(skillName && {
            skill: {
              name: { contains: skillName },
            },
          }),
          ...(skillLevel && { level: skillLevel }),
        },
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
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
            where: { isOffering: true }, // Only show offered skills
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
            take: 5, // Limit skills per user
          },
          _count: {
            select: {
              reviewsReceived: true,
            },
          },
        },
        orderBy: [
          { createdAt: 'desc' }, // Newest first
        ],
      }),
      this.prismaService.user.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      users,
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
}
