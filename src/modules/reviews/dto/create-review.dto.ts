import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Max, Min, IsString } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  swapRequestId: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  overallRating: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  communicationRating?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsInt()
  @Min(1)
  @Max(5)
  punctualityRating: number;

  @ApiPropertyOptional({ example: 'Great session!' })
  @IsOptional()
  @IsString()
  comment?: string;
}
