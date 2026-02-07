import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsDate,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class AdminSkillProviderDto {
  @ApiProperty({ description: 'Provider user ID' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Provider username' })
  @IsString()
  userName: string;

  @ApiProperty({ description: 'Provider profile image', nullable: true })
  @IsOptional()
  @IsString()
  image: string | null;

  @ApiProperty({ description: 'Provider bio', nullable: true })
  @IsOptional()
  @IsString()
  bio: string | null;

  @ApiProperty({ description: 'Skill level offered by provider' })
  @IsString()
  level?: string;

  @ApiProperty({ description: 'Session duration in minutes', nullable: true })
  @IsOptional()
  @IsNumber()
  sessionDuration?: number | null;
}

export class AdminSkillListItemDto {
  @ApiProperty({ description: 'Skill ID' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Skill name' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Skill provider',
    type: () => AdminSkillProviderDto,
  })
  @ValidateNested()
  @Type(() => AdminSkillProviderDto)
  provider: AdminSkillProviderDto;

  @ApiProperty({ description: 'Number of swap requests for this skill' })
  @IsNumber()
  requestsCount: number;

  @ApiProperty({ description: 'Skill creation date' })
  @IsDate()
  createdAt: Date;
}

export class AdminSkillsListResponseDto {
  @ApiProperty({
    description: 'List of skills',
    type: () => AdminSkillListItemDto,
    isArray: true,
  })
  @ValidateNested({ each: true })
  @Type(() => AdminSkillListItemDto)
  data: AdminSkillListItemDto[];

  @ApiProperty({ description: 'Total count of skills' })
  @IsInt()
  total: number;

  @ApiProperty({ description: 'Current page' })
  @IsInt()
  page: number;

  @ApiProperty({ description: 'Limit per page' })
  @IsInt()
  limit: number;
}

export class AdminSkillDetailsDto {
  @ApiProperty({ description: 'Skill ID' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Skill name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Skill description', nullable: true })
  @IsOptional()
  @IsString()
  description: string | null;

  @ApiProperty({ description: 'Skill category name' })
  @IsString()
  category: string;

  @ApiProperty({
    description: 'Skill provider',
    type: () => AdminSkillProviderDto,
  })
  @ValidateNested()
  @Type(() => AdminSkillProviderDto)
  provider: AdminSkillProviderDto;

  @ApiProperty({ description: 'Session language', default: 'English' })
  @IsString()
  language: string;

  @ApiProperty({ description: 'Number of swap requests for this skill' })
  @IsInt()
  requestsCount: number;

  @ApiProperty({ description: 'Skill creation date' })
  @IsDate()
  createdAt: Date;

  @ApiProperty({ description: 'Skill last update date' })
  @IsDate()
  updatedAt: Date;
}

export class AdminSkillsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by skill name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ['newest', 'oldest'],
    default: 'newest',
    description: 'Sort by creation date',
  })
  @IsOptional()
  @IsString()
  sort?: 'newest' | 'oldest';
}
