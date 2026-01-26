/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Patch,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConsumes,
  ApiBody,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from 'src/common/types/user.types';
import { Public } from '../auth/decorators/public.decorator';
import { AddUserSkillDto, SearchUsersDto, UpdateUserDto } from './dto';
import { ImageKitService } from './services/imagekit.service';

@ApiTags('users')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly imagekitService: ImageKitService,
  ) {}


  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'User profile retrieved successfully' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
  })
  async getCurrentUserProfile(@CurrentUser() user: RequestUser) {
    return this.userService.getCurrentUserProfile(user.id);
  }

  @Get('health')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Health check for users module' })
  healthCheck() {
    return {
      status: 'ok',
      message: 'Users module is working',
    };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ description: 'Profile updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
  })
  async updateCurrentUserProfile(
    @CurrentUser() user: RequestUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUserProfile(user.id, updateUserDto);
  }

  @Post('me/profile-image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload profile image' })
  @ApiBody({
    description: 'Profile image file',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, WebP - Max 5MB)',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Profile image uploaded successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'user-id',
          userName: 'testuser',
          image: 'https://ik.imagekit.io/your_id/users/image.jpg',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid file type or size' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async uploadProfileImage(
    @CurrentUser() user: RequestUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    // Upload to ImageKit
    const uploadResult = await this.imagekitService.uploadImage(file, 'users');

    // Update user profile with new image URL
    const updatedUser = await this.userService.updateProfileImage(
      user.id,
      uploadResult.url,
    );

    return updatedUser;
  }

  @Delete('me/profile-image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete profile image' })
  @ApiOkResponse({ description: 'Profile image deleted successfully' })
  async deleteProfileImage(@CurrentUser() user: RequestUser) {
    // Remove image URL from user profile (pass empty string instead of null)
    await this.userService.updateProfileImage(user.id, '');

    return { message: 'Profile image deleted successfully' };
  }

  @Post('me/skills')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add skill to user profile' })
  @ApiCreatedResponse({
    description: 'Skill added successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'skill-id',
          userId: 'user-id',
          skillId: 'skill-id',
          level: 'INTERMEDIATE',
          yearsOfExperience: 3,
          isOffering: true,
          skill: {
            id: 'skill-id',
            name: 'JavaScript',
            description: 'Programming language',
            category: {
              id: 'category-id',
              name: 'Programming',
              icon: '💻',
            },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input or skill already exists',
  })
  @ApiNotFoundResponse({ description: 'Skill not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async addUserSkill(
    @CurrentUser() user: RequestUser,
    @Body() addUserSkillDto: AddUserSkillDto,
  ) {
    return this.userService.addUserSkill(user.id, addUserSkillDto);
  }

  @Delete('me/skills/:skillId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove skill from user profile' })
  @ApiOkResponse({
    description: 'Skill removed successfully',
    schema: {
      example: {
        success: true,
        data: {
          message: 'Skill removed successfully',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User skill not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async removeUserSkill(
    @CurrentUser() user: RequestUser,
    @Param('skillId') skillId: string,
    @Query('isOffering') isOffering: string,
  ) {
    const isOfferingBool = isOffering === 'true';
    return this.userService.removeUserSkill(user.id, skillId, isOfferingBool);
  }

  @Get('me/skills')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user skills' })
  @ApiOkResponse({
    description: 'User skills retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          offeredSkills: [
            {
              id: 'user-skill-id',
              level: 'INTERMEDIATE',
              yearsOfExperience: 3,
              isOffering: true,
              createdAt: '2026-01-24T12:00:00.000Z',
              skill: {
                id: 'skill-id',
                name: 'JavaScript',
                description: 'Programming language',
                category: {
                  id: 'category-id',
                  name: 'Programming',
                  icon: '💻',
                },
              },
            },
          ],
          wantedSkills: [
            {
              id: 'user-skill-id',
              level: 'BEGINNER',
              yearsOfExperience: 0,
              isOffering: false,
              createdAt: '2026-01-24T12:00:00.000Z',
              skill: {
                id: 'skill-id',
                name: 'Python',
                description: 'Programming language',
                category: {
                  id: 'category-id',
                  name: 'Programming',
                  icon: '💻',
                },
              },
            },
          ],
          total: 2,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getUserSkills(@CurrentUser() user: RequestUser) {
    return this.userService.getUserSkills(user.id);
  }

  @Get(':id')
  @Public() // Public endpoint - no auth required
  @ApiOperation({ summary: 'Get user public profile by ID' })
  @ApiOkResponse({
    description: 'Public user profile retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'user-id',
          userName: 'johndoe',
          bio: 'Passionate developer',
          image: 'https://ik.imagekit.io/...',
          country: 'Palestine',
          location: 'Ramallah',
          timezone: 'Asia/Jerusalem',
          availability: 'FLEXIBLE',
          createdAt: '2026-01-20T10:00:00.000Z',
          skills: [
            {
              id: 'skill-id',
              level: 'INTERMEDIATE',
              yearsOfExperience: 3,
              isOffering: true,
              skill: {
                id: 'skill-id',
                name: 'JavaScript',
                description: 'Programming language',
                category: {
                  id: 'category-id',
                  name: 'Programming',
                  icon: '💻',
                },
              },
            },
          ],
          _count: {
            sentSwaps: 5,
            receivedSwaps: 8,
            badges: 2,
            reviewsGiven: 3,
            reviewsReceived: 4,
          },
          averageRating: 4.5,
          totalReviews: 4,
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getPublicUserProfile(@Param('id') userId: string) {
    return this.userService.getPublicUserProfile(userId);
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search users with filters' })
  @ApiOkResponse({
    description: 'Users retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          users: [
            {
              id: 'user-id',
              userName: 'johndoe',
              bio: 'Passionate developer',
              image: 'https://ik.imagekit.io/...',
              country: 'Palestine',
              location: 'Ramallah',
              timezone: 'Asia/Jerusalem',
              availability: 'FLEXIBLE',
              createdAt: '2026-01-20T10:00:00.000Z',
              skills: [
                {
                  id: 'skill-id',
                  level: 'INTERMEDIATE',
                  yearsOfExperience: 3,
                  skill: {
                    id: 'skill-id',
                    name: 'JavaScript',
                    category: {
                      name: 'Programming',
                      icon: '💻',
                    },
                  },
                },
              ],
              _count: {
                reviewsReceived: 4,
              },
            },
          ],
          pagination: {
            total: 50,
            page: 1,
            limit: 10,
            totalPages: 5,
            hasNextPage: true,
            hasPrevPage: false,
          },
        },
      },
    },
  })
  async searchUsers(@Query() searchDto: SearchUsersDto) {
    return this.userService.searchUsers(searchDto);
  }
}
