import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { SkillLevel } from '@prisma/client';

export class AddUserSkillDto {
  @ApiProperty({
    example: 'uuid-of-skill',
    description: 'ID of the skill from the skills list',
  })
  @IsString()
  @IsNotEmpty({ message: 'Skill ID is required' })
  skillId: string;

  @ApiProperty({
    enum: SkillLevel,
    example: SkillLevel.INTERMEDIATE,
    description: 'Your proficiency level for this skill',
  })
  @IsEnum(SkillLevel, { message: 'Invalid skill level' })
  level: SkillLevel;

  // @ApiPropertyOptional({
  //   example: 3,
  //   description: 'Years of experience with this skill',
  //   minimum: 0,
  //   maximum: 50,
  // })
  // @IsOptional()
  // @IsInt({ message: 'Years of experience must be a number' })
  // @Min(0)
  // @Max(50)
  // yearsOfExperience?: number;

  @ApiProperty({
    example: 'Arabic',
    description: 'Language you will use to teach this skill',
  })
  @IsString({ message: 'Session language must be a string' })
  @IsNotEmpty({ message: 'Session language is required' })
  sessionLanguage: string;

  @ApiProperty({
    example: 'I focus on practical projects and real-world examples.',
    description: 'Description of how you teach this skill',
  })
  @IsString({ message: 'Skill description must be a string' })
  @IsNotEmpty({ message: 'Skill description is required' })
  skillDescription: string;

  // @ApiPropertyOptional({
  //   example: 60,
  //   description: 'Typical session duration in minutes',
  //   minimum: 15,
  //   maximum: 240,
  // })
  // @IsOptional()
  // @IsInt({ message: 'Duration must be a number' })
  // @Min(15, { message: 'Session duration must be at least 15 minutes' })
  // @Max(240, { message: 'Session duration cannot exceed 240 minutes' })
  // sessionDuration?: number;
}
