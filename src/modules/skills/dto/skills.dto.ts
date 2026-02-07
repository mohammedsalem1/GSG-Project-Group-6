import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Availability, Prisma, SkillLevel } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsString, IsBoolean, IsUUID, IsOptional, IsArray, ValidateNested, IsNumber, IsEnum, ArrayNotEmpty } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class CategoryResponseDto {
  @ApiProperty({})
  @IsUUID()
  id: string;

  @ApiProperty({})
  @IsString()
  name: string;


  @ApiProperty({})
  @IsOptional()
  @IsString()
  icon: string | null;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  description: string | null;
}

export class SkillDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

 
}

export class CategorySkillsDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({
    type: () => SkillDto,
    isArray: true,
    description: 'List of skills in this category',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  skills: SkillDto[];
}

export class SkillInfoDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  description: string | null;

  @ApiProperty()
  @IsString()
  language: string;

  @ApiProperty()
  category:CategoryResponseDto 
}

export class ProviderDto {
  @ApiProperty()
  @IsString()
  userName: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  image: string | null;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  bio: string | null;

  @ApiProperty()
  @IsNumber()
  rating: number;

  @ApiProperty()
  @IsNumber()
  totalFeedbacks: number | undefined ;
}


export class LatestReviewDto {
  @ApiProperty()
  @IsString()
  reviewerName: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  reviewerImage: string | null;

  @ApiProperty()
  @IsOptional()
  @IsString()
  comment: string | null;
  

}

export class ReviewsSummaryDto {
  @ApiProperty()
  @IsNumber()
  count: number;

  @ApiProperty()
  @Type(() => LatestReviewDto)
  LatestReviewDto: LatestReviewDto | null;
}

export class UserSkillDetailsResponseDto {
  @ApiProperty()
  @Type(() => ProviderDto)
  provider: ProviderDto;

  @ApiProperty()
  @Type(() => SkillInfoDto)
  skill: SkillInfoDto;

  @ApiProperty()
  @IsString()
  level: string;


  @ApiProperty()
  @IsString()
  userSkillId:string

  @ApiProperty()
  @Type(() => ReviewsSummaryDto)
  reviews: ReviewsSummaryDto;

  @ApiProperty({ type: () => SessionDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionDto)
  sessions: (SessionDto | null)[];

  @ApiProperty()
  @IsNumber()
  countSessions: number;
}


export class FilterSkillDto extends PaginationDto {

  @ApiPropertyOptional({ example: 'WEEKENDS', enum: Availability })
  @IsOptional()
  @IsEnum(Availability)
  availability?: Availability;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')

  isOffering?: boolean;

  @ApiPropertyOptional({ example: 'English' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: 'BEGINNER', enum: SkillLevel })
  @IsOptional()
  @IsEnum(SkillLevel)
  level?: SkillLevel;
}



export class SearchSkillDto extends PaginationDto  {
  @ApiProperty()
  @IsString()
  name:string
}

export class ProviderWithSwapsDto {
  @ApiProperty()
  @IsString()
  userName: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  image: string | null;

  @ApiProperty()
  @IsString()
  level: string;



  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  bio: string | null;

  @ApiProperty()
  @IsNumber()
  receivedSwaps: number;

  @ApiProperty()
  @IsNumber()
  sentSwaps: number;

  @ApiProperty()
  @IsNumber()
  rating: number;

  @ApiProperty()
  @IsNumber()
  totalFeedbacks: number;
}


export class SearchUserSkillResponseDto {
  @ApiProperty({ type: SkillInfoDto })
  skill: SkillInfoDto;

  @ApiProperty({ type: ProviderWithSwapsDto })
  user: ProviderWithSwapsDto;
}

export class PopularSkillResponseDto {
  
  @ApiProperty({type: () => SkillDto})
  skill:SkillDto

  @ApiProperty()
  usersCount: number;
}
export class SessionDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  duration: number;

  @ApiProperty()
  createdAt: Date;
}


export class UpdateUserCategoriesDto {
  @ApiProperty({
  isArray: true,
  type: String,
  format: 'uuid'
})

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID("all", { each: true })
  selectedCatIds: string[];
}