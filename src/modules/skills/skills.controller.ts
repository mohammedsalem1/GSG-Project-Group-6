
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import { Type } from 'class-transformer';
import { Public } from '../auth/decorators/public.decorator';
import { CategoryResponseDto, CategorySkillsDto, FilterSkillDto, PopularSkillResponseDto, SearchSkillDto, SearchUserSkillResponseDto, UpdateUserCategoriesDto, UserSkillDetailsResponseDto } from './dto/skills.dto';
import { PaginatedResponseDto } from 'src/common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from 'src/common/types/user.types';


@ApiTags('skills')
@Controller('skills')
export class SkillsController {

  constructor(
     private readonly skillService:SkillsService
  ) {}  
  
  
  @Get('categories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all active categories' })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Categories fetched successfully' , type:CategoryResponseDto })
  @ApiNotFoundResponse({ description: 'No categories found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
   async getAllCategories():Promise<CategoryResponseDto[]> {
       return this.skillService.getAllCategories()    
   }

   
   @Get('categories/:categoryId/skills')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('JWT-auth')
   @ApiOperation({ summary: 'Get all skills for a specific category' })
   @ApiParam({name: 'categoryId',description: 'Category ID',required: true})
   @HttpCode(HttpStatus.OK)
   @ApiOkResponse({ description: 'get all skills  successfully' , type: CategorySkillsDto })
   @ApiNotFoundResponse({ description: 'Category not found or no skills found' })
   @ApiInternalServerErrorResponse({ description: 'Internal server error' })
   async getSkillsByCategoty( 
      @Param('categoryId') categoryId: string
   ):Promise<CategorySkillsDto> {
       return this.skillService.getSkillsByCategory(categoryId)
   }
   
   @Get('search')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('JWT-auth')
   @ApiOperation({ summary: 'search skills'})
   @ApiQuery({name: 'name',description: 'name Skill or category',required: true})
   @HttpCode(HttpStatus.OK)
   @ApiOkResponse({ description: 'get skills search successfully' ,  schema: {
      example: {
        success: true,
        data: {
         skill: {
             name:'node' , language:'English' , description:'sdadsasd' , 
             category: {id:'sdaaaaa' ,name:'web' , icon: ' ' , description:'saaaaa'} ,
         },
         user: {
           userName: 'ahmed',
           image: '',
           level:'BEGINEER',
           yearsOfExperience:'2',
           bio: 'DSAAAAAA',
           receivedSwaps: 0,
           sentSwaps: 0,
           averageRating:3,
           totalReviews:5,
    },
        }
      },
    }, })
   @ApiBadRequestResponse({ description: 'Category not found or no skills found' })
   @ApiInternalServerErrorResponse({ description: 'Internal server error' })
   async searchSkills(@Query() query:SearchSkillDto):Promise<PaginatedResponseDto<SearchUserSkillResponseDto>> {
        return this.skillService.searchSkills(query)
   }

   @Get('discover')
   @ApiOperation({ summary: 'filter skills'})
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('JWT-auth')
   @HttpCode(HttpStatus.OK)
   @ApiOkResponse({ description: 'filter skills successfully' , type: SearchUserSkillResponseDto })
   @ApiNotFoundResponse({ description: 'User skill not found' })
   @ApiInternalServerErrorResponse({ description: 'Internal server error' })
   async filterSkills(@Query() query:FilterSkillDto):Promise<PaginatedResponseDto<SearchUserSkillResponseDto>> {
        return this.skillService.filterSkills(query)
   }

   @Get(':skillId/users/:userId/details')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('JWT-auth')
   @ApiOperation({ summary: 'Get skill details for specific user'})
   @ApiNotFoundResponse({ description: 'User skill not found' })
   @ApiOkResponse({description:"get details UserSkill successfully", type:UserSkillDetailsResponseDto})
   @ApiUnauthorizedResponse({ description: 'Unauthorized' })
   @ApiParam( {name: 'skillId',description: 'Skill ID',required: true})
   @ApiParam( {name: 'userId',description: 'User  ID',required: true})
   @ApiInternalServerErrorResponse({ description: 'Internal server error' })
   async getUserSkillDetails(
    @Param('skillId') skillId: string,
    @Param('userId')  userId : string
   ):Promise<UserSkillDetailsResponseDto>{
      return this.skillService.getUserSkillDetails(skillId , userId)
   }

   
  @Get('popular')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get popular skill'})
  @ApiOkResponse({ type: PopularSkillResponseDto })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })

  async getPopularSkill():Promise<PopularSkillResponseDto[]> {
     return this.skillService.getPopularSkill()
  }

    
  @Patch('users/selected-categories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update selected categories for current user' })
  @ApiOkResponse({description: 'Selected categories updated successfully'})
  @ApiOperation({ summary: 'update Selected Category user'})
  async updateCategories(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateUserCategoriesDto
  ) {
    return this.skillService.updateSelectedCategories(user.id, dto.selectedCatIds);
  }

  @Get('recommended-user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get recommanded user skill'})
  @ApiOkResponse({   schema: {
      example: {
        success: true,
        data: {
         skill: {
             name:'node' , language:'English' , description:'sdadsasd' , 
             category: {id:'sdaaaaa' ,name:'web' , icon: ' ' , description:'saaaaa'} ,
         },
         user: {
           userName: 'ahmed',
           image: '',
           level:'BEGINEER',
           yearsOfExperience:'2',
           bio: 'DSAAAAAA',
           receivedSwaps: 0,
           sentSwaps: 0,
           averageRating:3,
           totalReviews:5,
    },
        }
      },
    }, })
  async getRecommendedUserSkills(@CurrentUser() user:RequestUser) {
   return this.skillService.getRecommendedUserSkills(user.id)
  }

} 
