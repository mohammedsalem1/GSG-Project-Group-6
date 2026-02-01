import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { Availability, SkillLevel } from '@prisma/client';

export class SearchUsersDto {
  @ApiPropertyOptional({
    description: 'Search query (username, bio, location)',
    example: 'john developer',
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description: 'Filter by country',
    example: 'Palestine',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'Filter by location/city',
    example: 'Ramallah',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Filter by availability',
    enum: Availability,
    example: 'FLEXIBLE',
  })
  @IsOptional()
  @IsEnum(Availability)
  availability?: Availability;

  @ApiPropertyOptional({
    description: 'Filter by skill name (user must offer this skill)',
    example: 'JavaScript',
  })
  @IsOptional()
  @IsString()
  skillName?: string;

  @ApiPropertyOptional({
    description: 'Filter by minimum skill level',
    enum: SkillLevel,
    example: 'INTERMEDIATE',
  })
  @IsOptional()
  @IsEnum(SkillLevel)
  skillLevel?: SkillLevel;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
