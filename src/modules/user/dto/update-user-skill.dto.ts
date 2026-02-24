import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { SkillLevel } from '@prisma/client';

export class UpdateUserSkillDto {

  @ApiPropertyOptional({ description: 'Proficiency level in this skill', enum: SkillLevel })
  @IsOptional()
  @IsEnum(SkillLevel)
  level?: SkillLevel;

  @ApiPropertyOptional({ description: 'Years of experience with this skill' })
  @IsOptional()
  @IsInt()
  yearsOfExperience?: number;

  @ApiPropertyOptional({ description: 'Language used for the session' })
  @IsOptional()
  @IsString()
  sessionLanguage?: string;

  @ApiPropertyOptional({ description: 'Description about the skill' })
  @IsOptional()
  @IsString()
  skillDescription?: string;
}