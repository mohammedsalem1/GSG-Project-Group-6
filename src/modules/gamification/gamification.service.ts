import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { Prisma, PointType, Badge } from '@prisma/client';
import { UserBadgeWithBadge } from './types/userBadge.type';
import { PrismaService } from 'src/database/prisma.service';
import { EarnedBadgeDto, LockedBadgeDto } from '../admin/dto/admin-get-locked-badge.dto';



@Injectable()
export class GamificationService {
  constructor(
    private prismaService: PrismaService,
    private userService: UserService
  ) {}

  // ===== CHECK BADGES =====
  async checkBadges(userId: string) {
    const user = await this.userService.findUserById(userId);
    const completedSessions =
      user.hostedSessions.length + user.attendedSessions.length;

    const badges = await this.prismaService.badge.findMany({
      where: { isActive: true },
      orderBy: { requirement: 'asc' },
    });

    const ownedBadgeIds = new Set(user.badges.map(b => b.badgeId));

    const newlyUnlocked: UserBadgeWithBadge[] = [];
    let nextBadge: Badge | null = null;

    for (const badge of badges) {
      if (ownedBadgeIds.has(badge.id)) continue;

      const requiredSessions = Number(badge.requirement);

      if (completedSessions < requiredSessions) {
        if (!nextBadge) nextBadge = badge;
        break; 
      }    

      // Unlock badge
      const userBadge = await this.prismaService.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
          unlockedAt: new Date(),
        },
        include: { badge: true },
      });

      await this.awardPoints(
        userId,
        badge.points,
        `Unlocked badge: ${badge.name}`,
        PointType.EARNED
      );

      newlyUnlocked.push(userBadge);
    // If all badges are unlocked, set nextBadge to the last badge
      if (!nextBadge && badges.length > 0) {
         nextBadge = badges[badges.length - 1];
       }
    }

      return {
        newlyUnlocked,
        nextBadge,
     };
    }

  // ===== AWARD POINTS =====
  async awardPoints(
    userId: string,
    amount: number,
    reason: string,
    type: PointType,
  ) {
    const point = await this.prismaService.point.create({
      data: { userId, amount, reason, type },
    });
    return point;
  }

  // ===== GET USER POINTS =====
  async getUserPoints(userId: string) {
    const points = await this.prismaService.point.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const total = points.reduce((sum, p) => sum + p.amount, 0);

    return {
      total,
      points,
    };
  }

  // ===== GET ALL BADGES =====
  async getAllBadges(userId: string) {
    const badges = await this.prismaService.badge.findMany({
      where: { isActive: true },
      orderBy: { requirement: 'asc' },
    });

    if (!userId) return { badges };

    const user = await this.userService.findUserById(userId);
    const completedSessions =
      user.hostedSessions.length + user.attendedSessions.length;

    const userBadges = await this.prismaService.userBadge.findMany({
      where: { userId },
      select: { badgeId: true, unlockedAt: true, isPinned: true },
    });

    const ownedBadgeIds = new Set(userBadges.map(b => b.badgeId));

    let nextBadge: Badge | null = null;


    for (const badge of badges) {
        if (!ownedBadgeIds.has(badge.id)) {
          nextBadge = badge;
          break;
        }
    }

    const ownedBadges = badges
      .filter(badge => ownedBadgeIds.has(badge.id))
      .map(badge => {
        const userBadge = userBadges.find(b => b.badgeId === badge.id);

        return {
          ...badge,
          isUnlocked: true,
          unlockedAt: userBadge?.unlockedAt,
          isPinned: userBadge?.isPinned ?? false,
        };
      });

    return {
      completedSessions,
      nextBadge,
      badges: ownedBadges,
    };
  }

  // Get All badges and totoal users
  async getAllBadgesWithCount() {
  const badges = await this.prismaService.badge.findMany({
    where: { isActive: true },
    orderBy: { requirement: 'asc' },
    include: {
      _count: {
        select: {
          users:true
        },
      },
    },
  });

  return badges.map(badge => ({
    ...badge,
    totalUsers: badge._count.users,
  }));
  }
  
  async updateBadgeRequirement(
    badgeId: string,
    requirement: string,
  ) {
    const badge = await this.prismaService.badge.findUnique({
      where: { id: badgeId },
    });

    if (!badge) {
      throw new NotFoundException('Badge not found');
    }

    return this.prismaService.badge.update({
      where: { id: badgeId },
      data: { requirement },
    });
  }

  async getAllUserBadges(userId: string) {
    
    const user = await this.userService.findUserById(userId);    
    if (!user) {
          throw new BadRequestException('the user not found')
    }

    const badges = await this.prismaService.badge.findMany({
      where: { isActive: true },
      orderBy: { requirement: 'asc' },
      select: {
        id: true,
        name: true,
        icon: true,
        requirement: true,
        
      },
    });

    const completedSessions =
      user.hostedSessions.length + user.attendedSessions.length;

    const userBadges = await this.prismaService.userBadge.findMany({
      where: { userId },
      select: { badgeId: true, unlockedAt: true },
    });

    const userBadgeMap = new Map(
      userBadges.map(b => [b.badgeId, b.unlockedAt])
    );

    const earnedBadges:EarnedBadgeDto[] = [];
    const lockedBadges:LockedBadgeDto[] = [];

    for (const badge of badges) {
      const unlockedAt = userBadgeMap.get(badge.id);

      if (unlockedAt) {
        // ✅ Earned
        earnedBadges.push({
          name: badge.name,
          icon: badge.icon,
          requirement:badge.requirement,
          unlockedAt,
        });
      } else {
        // 🔒 Locked
        const requirement = Number(badge.requirement)
        const completed = Math.min(completedSessions, requirement);

        const remainingSessions = Math.max(
          requirement - completedSessions,
          0
        );

        lockedBadges.push({
          name: badge.name,
          icon: badge.icon,
          progress: `${completed}/${badge.requirement}`,
          remainingSessions,
        });
      }
    }

    return {
      user:{
        id: user.id,
        userName: user.userName,
        image: user.image,
        email:user.email
     },
      completedSessions,
      earnedBadges,
      lockedBadges,
    };
 }
}
