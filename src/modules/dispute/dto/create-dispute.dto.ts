import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { DisputeType } from '@prisma/client';

export class CreateDisputeDto {
  @ApiProperty({
    enum: DisputeType,
    example: DisputeType.SESSION_ISSUE,
    description: 'Type of issue being reported',
  })
  @IsEnum(DisputeType, { message: 'Please select a valid issue type' })
  type: DisputeType;

  @ApiPropertyOptional({
    example: 'The session was cancelled without notice...',
    description: 'Tell us more about the issue (max 500 characters)',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;

  @ApiPropertyOptional({
    example: 'https://ik.imagekit.io/...',
    description: 'Screenshot URL (uploaded via /dispute/screenshot)',
  })
  @IsOptional()
  @IsString()
  screenshot?: string;

  @ApiPropertyOptional({
    example: 'uuid-of-session',
    description: 'Related session ID (optional)',
  })
  @IsOptional()
  @IsUUID()
  sessionId?: string;
}
