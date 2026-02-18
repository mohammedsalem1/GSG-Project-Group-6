import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
} from 'class-validator';
import { SkillLevel } from '@prisma/client';

export class AddUserSkillDto {

  @ApiProperty({
    example: 'uuid-of-skill',
    description: 'ID of the skill to add',
  })
  @IsString()
  @IsNotEmpty({ message: 'Skill ID is required' })
  skillId: string;

  @ApiProperty({
    enum: SkillLevel,
    example: SkillLevel.INTERMEDIATE,
    description: 'User proficiency level',
  })
  @IsEnum(SkillLevel, { message: 'Invalid skill level' })
  level: SkillLevel;

  @ApiPropertyOptional({
    example: 3,
    description: 'Years of experience',
  })
  @IsOptional()
  @IsInt({ message: 'Years of experience must be a number' })
  yearsOfExperience?: number;

  @ApiPropertyOptional({
    example: 'Arabic',
    description: 'Language used during the session',
  })
  @IsOptional()
  @IsString({ message: 'Session language must be a string' })
  sessionLanguage?: string;

  @ApiPropertyOptional({
    example: 'I focus on practical projects and real-world examples.',
    description: 'How the user offers this skill',
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  skillDescription?: string;
}
