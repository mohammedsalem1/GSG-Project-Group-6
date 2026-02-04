import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Max, Min, IsString } from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  sessionId: string;

  @ApiPropertyOptional({ example: 4 })
  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  sessionFocus: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  activeParticipation?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsInt()
  @Min(1)
  @Max(5)
  learningFocus: number;

  @ApiPropertyOptional({ example: 3 })
  @IsInt()
  @Min(1)
  @Max(5)
  clarity: number;

  @ApiPropertyOptional({ example: 3 })
  @IsInt()
  @Min(1)
  @Max(5)
  patience: number;

  @ApiPropertyOptional({ example: 3 })
  @IsInt()
  @Min(1)
  @Max(5)
  sessionStructure: number;

  @ApiPropertyOptional({ example: 3 })
  @IsInt()
  @Min(1)
  @Max(5)
  communication: number;

  @ApiPropertyOptional({ example: 'Great session!' })
  @IsOptional()
  @IsString()
  strengths?: string;

  @ApiPropertyOptional({ example: 'Great session!' })
  @IsOptional()
  @IsString()
  improvements?: string;
}
