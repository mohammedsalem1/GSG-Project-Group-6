import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { PointType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type{ RequestUser } from 'src/common/types/user.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('gamification')
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

 // ================= CHECK BADGES =================
  @Get('badges/check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Check and unlock new badges for a user' })
  @ApiResponse({ status: 200, description: 'Newly unlocked badges returned.' , 
      schema: {
        example: {
            success: true,
            data: {
                "newlyUnlocked": [],
                "nextBadge": {
                "id": "badge-id",
                "name": "First Exchange",
                "description": "Unlocked after 1 completed session",
                "icon": "🎯",
                "category": "ACHIEVEMENT",
                "requirement": "1",
                "points": 50,
                "isActive": true,
                "createdAt": "2026-02-12T14:28:38.945Z"
                }
            }
        }
    }})

  async checkBadges(
    @CurrentUser() user: RequestUser, 
  ) {
    return this.gamificationService.checkBadges(user.id);
  }

  // ================= GET USER POINTS =================
  @Get('points/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get points and total for a user' })
  @ApiResponse({ status: 200, description: 'User points retrieved successfully.' , 
      schema: {
        example: {
            success: true,
           "data": {
                "total": 10,
                "points": [
                {
                    "id": "point-id",
                    "userId": "c1157631-1a13-4904-a00d-11e76e709ca0",
                    "amount": 10,
                    "reason": "Completed session as host",
                    "type": "EARNED",
                    "createdAt": "2026-02-06T18:41:14.495Z"
                }
                ]
            }
        }
    }})
   
  async getUserPoints(@Param('userId') userId: string) {
    return this.gamificationService.getUserPoints(userId);
  }

  // ================= GET ALL BADGES =================
  @Get('badges/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all badges with user progress' })
  @ApiResponse({ status: 200, description: 'Badges retrieved successfully.',
       schema: {
        example: {
            success: true,
             "data": {
                "completedSessions": 0,
                "nextBadge": {},
                "badges":{}
        }
    }
    }
   })
  async getAllBadges(@Param('userId') userId: string) {
    return this.gamificationService.getAllBadges(userId);
  }

}
