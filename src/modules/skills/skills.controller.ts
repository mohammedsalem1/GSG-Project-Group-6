
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import { Type } from 'class-transformer';
import { Public } from '../auth/decorators/public.decorator';
import { CategoryResponseDto, CategorySkillsDto, FilterSkillDto, PopularSkillResponseDto, SearchSkillDto, SearchUserSkillResponseDto, SkillDto, UpdateUserCategoriesDto, UserSkillDetailsResponseDto } from './dto/skills.dto';
import { PaginatedResponseDto } from 'src/common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from 'src/common/types/user.types';
import { CreateSkillDto, SkillResponseDto } from './dto/create-skill.dto';
import { Skill } from '@prisma/client';
import { TrendingSkillResponseDto } from './dto/trendingSkillResponse.dto';


@ApiTags('skills')
@Controller('skills')
export class SkillsController {

  constructor(
     private readonly skillService:SkillsService
  ) {}  
  
  // @Post('create')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'add skill from user'})
  // @ApiCreatedResponse({ description: 'Created Skill successfully'})
  // @HttpCode(HttpStatus.CREATED)
  // async findOrCreateSkill(@Body() dto: CreateSkillDto): Promise<{ skill:SkillResponseDto, alreadyExists: boolean }> {
  //   return this.skillService.findOrCreateSkill(dto.name);
  // }



  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all active skills'})
  @ApiOkResponse({ description: 'Get all active skills successfully', type:SkillDto})
  @HttpCode(HttpStatus.OK)
  async getAllSkills():Promise<SkillDto[]> {
    return this.skillService.getAllSkills()
  }
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

   @Get('autocomplete')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('JWT-auth')
   @HttpCode(HttpStatus.OK)
   @ApiOperation({ summary: 'Search skills for autocomplete' })
   @ApiQuery({ name: 'name', required: false, description: 'Partial or full skill name', type: String })
   async autocomplete(@Query('name') name: string) {
       return this.skillService.autocomplete(name);
   }

   
   @Get('search')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('JWT-auth')
   @ApiOperation({ summary: 'Get all users who have this skill by search skill'})
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
           rating: 3.3,
           totalFeedback: 1
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
   @ApiOperation({ summary: 'Get all users who have this skill by filter skill'})
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

    


  @Get('recommended-user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get recommanded user skill'})
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })

  @ApiOkResponse({   schema: {
      example: {
        success: true,
        data: {
         skill: {
            id:"dsa....", name:'node' , language:'English' , description:'sdadsasd' , 
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
           avarage:3,
           totalFeedbacks:5,
    },
        }
      },
    }, })
  async getRecommendedUserSkills(@CurrentUser() user:RequestUser) {
   return this.skillService.getRecommendedUserSkills(user.id)
  }


    @Get(':skillId/similar')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get one similar user offering the same skill' })
    @ApiOkResponse({
      description: 'Get one similar user successfully',
      type: SearchUserSkillResponseDto,
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiNotFoundResponse({ description: 'Skill not found or no similar users' })
    @ApiParam({
      name: 'skillId',
      description: 'Skill ID',
      required: true,
    })
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    async getSimilarUserBySkill(
      @Param('skillId') skillId: string,
      @CurrentUser() user:RequestUser
    ): Promise<{ data: SearchUserSkillResponseDto }> {
      const currentUserId = user.id;
      return this.skillService.getOneSimilarUserBySkill(
        skillId,
        currentUserId,
      );
    }
    

  // trending skill
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @Get('trending')
    @ApiOperation({ summary: 'Get trending skills this week based on sessions' })
    @ApiOkResponse({
      description: 'Trending skills by sessions retrieved successfully',
      type: TrendingSkillResponseDto , 
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    async getTrendingSkillsThisWeek(): Promise<TrendingSkillResponseDto[]> {
      return await this.skillService.getTrendingSkillsThisWeek();    
    }
    

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @Get('learned-skills')
    @ApiOperation({ summary: 'get learned skill count' })
    async getLearnedSkillsCount(@CurrentUser() user:RequestUser) {
      return await this.skillService.getLearnedSkillsCount(user.id);
    }
} 
