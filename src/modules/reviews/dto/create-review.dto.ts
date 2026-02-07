import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Max, Min, IsString } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  swapRequestId: string;

  @ApiPropertyOptional({ example: 'Great session!' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ example: true, description: 'Set review as public or private' })
  @IsOptional()
  isPublic?: boolean;
}
