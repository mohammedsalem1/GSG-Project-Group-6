import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsEnum, Min, Max, IsOptional, IsBoolean, IsString } from 'class-validator';

export enum PointActionType {
  ADD = 'ADD',
  DEDUCT = 'DEDUCT',
}

export class AdjustUserPointsDto {
  @ApiProperty({
    description: 'Action type: add or deduct points',
    enum: PointActionType,
    example: PointActionType.ADD,
  })
  @IsEnum(PointActionType)
  actionType: PointActionType;

  @ApiProperty({
    description: 'Number of points to add or deduct',
    example: 50,
  })
  @IsInt()
  @Min(1)
  @Max(10000)
  points: number;

  @ApiProperty({
    description: 'Reason for adjusting points',
    example: 'Compensation for technical issue during swap session',
  })
  @IsString()
  reason: string;


}