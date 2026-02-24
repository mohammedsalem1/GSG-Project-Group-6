// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// import { FeedbackCategory } from '@prisma/client';
// import { IsInt, IsOptional, IsUUID, Max, Min, IsString, IsEnum, IsBoolean } from 'class-validator';

// export class CreateFeedbackDto {
//   @ApiProperty({ 
//     example: 'uuid',
//     description: 'The ID of the session for which the feedback is being given.'
//   })
//   @IsUUID()
//   sessionId: string;

//   @ApiProperty({ 
//     enum: FeedbackCategory, 
//     default: FeedbackCategory.GENERAL,
//     description: 'The role of the user giving feedback. Determines which fields are relevant: TEACHING, LEARNING, GENERAL.'
//   })
//   @IsEnum(FeedbackCategory)
//   role: FeedbackCategory;
  

//   @ApiPropertyOptional({
//     description: 'Did the user show up on time?',
//   })
//   @IsOptional()
//   @IsBoolean()
//   onTime?: boolean;

//   @ApiPropertyOptional({ 
//     description: 'Only for TEACHING role: How focused the teacher was during the session. Scale 1-5.'
//   })
//   @IsInt()
//   @Min(1)
//   @Max(5)
//   @IsOptional()
//   sessionFocus?: number;

//   @ApiPropertyOptional({ 
//     description: 'Only for TEACHING role: Level of active participation from the teacher. Scale 1-5.'
//   })
//   @IsInt()
//   @Min(1)
//   @Max(5)
//   @IsOptional()
//   activeParticipation?: number;

//   @ApiPropertyOptional({ 
//     description: 'Only for LEARNING role: How focused the learner was during the session. Scale 1-5.'
//   })
//   @IsInt()
//   @Min(1)
//   @Max(5)
//   @IsOptional()
//   learningFocus?: number;

//   @ApiPropertyOptional({
//     description:
//       'Only for TEACHING role: How open the user was to feedback. Scale 1-5.',
//   })
//   @IsOptional()
//   @IsInt()
//   @Min(1)
//   @Max(5)
//   openToFeedback?: number;

//   @ApiPropertyOptional({ 
//     description: 'Only for LEARNING role: Clarity of the learner. Scale 1-5.'
//   })
//   @IsInt()
//   @Min(1)
//   @Max(5)
//   @IsOptional()
//   clarity?: number;

//   @ApiPropertyOptional({ 
//     description: 'Only for LEARNING role: Patience of the learner. Scale 1-5.'
//   })
//   @IsInt()
//   @Min(1)
//   @Max(5)
//   @IsOptional()
//   patience?: number;

//   @ApiPropertyOptional({ 
//     description: 'Only for LEARNING role: How well the session was structured. Scale 1-5.'
//   })
//   @IsInt()
//   @Min(1)
//   @Max(5)
//   @IsOptional()
//   sessionStructure?: number;

//   @ApiPropertyOptional({ 
//     description: 'Shared field: Overall communication quality. Scale 1-5.'
//   })
//   @IsInt()
//   @Min(1)
//   @Max(5)
//   @IsOptional()
//   communication?: number;

//   @ApiPropertyOptional({ 
//     description: 'Shared field: Strengths observed during the session. Optional text.'
//   })
//   @IsOptional()
//   @IsString()
//   strengths?: string;

//   @ApiPropertyOptional({ 
//     description: 'Shared field: Areas for improvement observed during the session. Optional text.'
//   })
//   @IsOptional()
//   @IsString()
//   improvements?: string;
// }
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, Max, IsString, IsBoolean, IsUUID } from 'class-validator';

export class BaseFeedbackDto {

  @ApiProperty({ 
    example: 'uuid',
    description: 'The ID of the session for which the feedback is being given.'
  })
  @IsUUID()
  sessionId: string;

  @ApiPropertyOptional({ description: 'Shared field: Overall communication quality. Scale 1-5.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  communication?: number;

  @ApiPropertyOptional({ description: 'Shared field: Strengths observed during the session. Optional text.' })
  @IsOptional()
  @IsString()
  strengths?: string;

  @ApiPropertyOptional({ description: 'Shared field: Areas for improvement observed during the session. Optional text.' })
  @IsOptional()
  @IsString()
  improvements?: string;
}

export class TeachingFeedbackDto extends BaseFeedbackDto {
  @ApiPropertyOptional({ description: 'Teacher focus during session. Scale 1-5.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  sessionFocus?: number;

  @ApiPropertyOptional({ description: 'Active participation of teacher. Scale 1-5.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  activeParticipation?: number;

  @ApiPropertyOptional({ description: 'Openness to feedback. Scale 1-5.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  openToFeedback?: number;

  @ApiPropertyOptional({ description: 'Did the user show up on time?' })
  @IsOptional()
  @IsBoolean()
  onTime?: boolean;
}

export class LearningFeedbackDto extends BaseFeedbackDto {
  @ApiPropertyOptional({ description: 'Learner focus during session. Scale 1-5.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  learningFocus?: number;

  @ApiPropertyOptional({ description: 'Clarity of the learner. Scale 1-5.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  clarity?: number;

  @ApiPropertyOptional({ description: 'Patience of the learner. Scale 1-5.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  patience?: number;

  @ApiPropertyOptional({ description: 'Session structure quality. Scale 1-5.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  sessionStructure?: number;

  @ApiPropertyOptional({ description: 'Did the user show up on time?' })
  @IsOptional()
  @IsBoolean()
  onTime?: boolean;
}