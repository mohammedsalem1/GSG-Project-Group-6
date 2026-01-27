import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBadRequestResponse, ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from 'src/common/types/user.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserCategoriesDto } from '../skills/dto/skills.dto';

@ApiTags('users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch('me/categories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update selected categories for current user' })
  @ApiOkResponse({description: 'Selected categories updated successfully' ,   schema: {
      example: {
        success: true,
        data: {
          userId:"dsadssadsassddsdas" , 
          userName:"mohammed",
          selectedCatIds:"nku"
        }}
      }} )
  @ApiOperation({ summary: 'update Selected Category user'})
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Some category IDs were not found' })
  async updateCategories(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateUserCategoriesDto
  ) {
    return this.userService.updateUserSelectedCategories(user.id, dto.selectedCatIds);
  }
}
