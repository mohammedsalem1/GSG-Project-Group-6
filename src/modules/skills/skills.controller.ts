
import { Controller, Get, HttpCode, HttpStatus, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import { Type } from 'class-transformer';
import { Public } from '../auth/decorators/public.decorator';
import { CategoryResponseDto, CategorySkillsDto, FilterSkillDto, PopularSkillResponseDto, SearchSkillDto, SearchUserSkillResponseDto, UserSkillDetailsDto } from './dto/skills.dto';
import { PaginatedResponseDto } from 'src/common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';


@ApiTags('skills')
@Controller('skills')
export class SkillsController {

  constructor(
     private readonly skillService:SkillsService
  ) {}  
  
  
  @Get('categories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Public()
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
   
   @Public()
   @Get('search')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('JWT-auth')
   @ApiOperation({ summary: 'search skills'})
   @ApiQuery({name: 'name',description: 'name Skill or category',required: true})
   @HttpCode(HttpStatus.OK)
   @ApiOkResponse({ description: 'get skills search successfully' , type: SearchUserSkillResponseDto })
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
   @ApiBadRequestResponse({ description: 'no Skills' })
   @ApiInternalServerErrorResponse({ description: 'Internal server error' })
   async filterSkills(@Query() query:FilterSkillDto):Promise<PaginatedResponseDto<SearchUserSkillResponseDto>> {
        return this.skillService.filterSkills(query)
   }

   @Get(':skillId/users/:userId/details')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('JWT-auth')
   @ApiOperation({ summary: 'Get skill details for specific user'})
   @ApiOkResponse({ type: UserSkillDetailsDto })
   @ApiBadRequestResponse({ description: 'The user does not have this skill' })
   @ApiParam( {name: 'skillId',description: 'Skill ID',required: true})
   @ApiParam( {name: 'userId',description: 'User  ID',required: true})
   async getUserSkillDetails(
    @Param('skillId') skillId: string,
    @Param('userId')  userId : string
   ){
      return this.skillService.getUserSkillDetails(skillId , userId)
   }

   
  @Get('popular')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get popular skill'})
  @ApiOkResponse({ type: PopularSkillResponseDto })
  async getPopularSkill():Promise<PopularSkillResponseDto[]> {
     return this.skillService.getPopularSkill()
  }
}