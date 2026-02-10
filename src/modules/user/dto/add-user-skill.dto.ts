import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { SkillLevel } from '@prisma/client';

export class AddUserSkillDto {
  @ApiProperty({
    example: 'uuid-of-skill',
    description: 'ID of the skill to add',
  })
  @IsNotEmpty({ message: 'Skill ID is required' })
  @IsString()
  skillId: string;

  @ApiProperty({
    enum: SkillLevel,
    example: SkillLevel.INTERMEDIATE,
    description: 'Proficiency level in this skill',
  })
  @IsNotEmpty({ message: 'Skill level is required' })
  @IsEnum(SkillLevel, { message: 'Invalid skill level' })
  level: SkillLevel;

  @ApiProperty({
    example: 3,
    description: 'Years of experience with this skill',
    minimum: 0,
    maximum: 50,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Years of experience must be a whole number' })
  @Min(0, { message: 'Years of experience cannot be negative' })
  @Max(50, { message: 'Years of experience cannot exceed 50' })
  yearsOfExperience?: number;

  @ApiProperty({
    example: true,
    description: 'Whether user is offering to teach this skill',
    default: true,
  })
  @IsNotEmpty({ message: 'Please specify if you are offering this skill' })
  @IsBoolean()
  isOffering: boolean;
}
