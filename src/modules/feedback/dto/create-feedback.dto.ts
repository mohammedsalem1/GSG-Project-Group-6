import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackCategory } from '@prisma/client';
import { IsInt, IsOptional, IsUUID, Max, Min, IsString, IsEnum } from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty({ 
    example: 'uuid',
    description: 'The ID of the session for which the feedback is being given.'
  })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ 
    enum: FeedbackCategory, 
    default: FeedbackCategory.GENERAL,
    description: 'The role of the user giving feedback. Determines which fields are relevant: TEACHING, LEARNING, GENERAL.'
  })
  @IsEnum(FeedbackCategory)
  role: FeedbackCategory;

  @ApiPropertyOptional({ 
    description: 'Only for TEACHING role: How focused the teacher was during the session. Scale 1-5.'
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  sessionFocus?: number;

  @ApiPropertyOptional({ 
    description: 'Only for TEACHING role: Level of active participation from the teacher. Scale 1-5.'
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  activeParticipation?: number;

  @ApiPropertyOptional({ 
    description: 'Only for LEARNING role: How focused the learner was during the session. Scale 1-5.'
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  learningFocus?: number;

  @ApiPropertyOptional({ 
    description: 'Only for LEARNING role: Clarity of the learner. Scale 1-5.'
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  clarity?: number;

  @ApiPropertyOptional({ 
    description: 'Only for LEARNING role: Patience of the learner. Scale 1-5.'
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  patience?: number;

  @ApiPropertyOptional({ 
    description: 'Only for LEARNING role: How well the session was structured. Scale 1-5.'
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  sessionStructure?: number;

  @ApiPropertyOptional({ 
    description: 'Shared field: Overall communication quality. Scale 1-5.'
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  communication?: number;

  @ApiPropertyOptional({ 
    description: 'Shared field: Strengths observed during the session. Optional text.'
  })
  @IsOptional()
  @IsString()
  strengths?: string;

  @ApiPropertyOptional({ 
    description: 'Shared field: Areas for improvement observed during the session. Optional text.'
  })
  @IsOptional()
  @IsString()
  improvements?: string;
}
