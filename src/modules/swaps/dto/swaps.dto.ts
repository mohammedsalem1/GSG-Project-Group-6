import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SwapStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class CreateSwapRequestDto {
  @ApiProperty({ example: '2b4f7c7a-8f4a-4a8b-9d6b-6c1e9f2c1a11' })
  @IsNotEmpty()
  @IsUUID()
  receiverId: string;

  @ApiProperty({ example: '3c1a2b7f-1e6d-4b6a-9d1b-8c9f4a2d7e33' })
  @IsNotEmpty()
  @IsUUID()
  offeredSkillId: string;

  @ApiProperty({ example: '9f4a2d7e-3c1a-4b6a-8c9f-1e6d2b7f5a12' })
  @IsNotEmpty()
  @IsUUID()
  requestedSkillId: string;

  @ApiPropertyOptional({ example: 'Hi, I can teach React in exchange for UI/UX.' })
  @IsOptional()
  @IsString()
  message?: string;
}

export class SwapRequestsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: SwapStatus, example: SwapStatus.PENDING })
  @IsOptional()
  @IsEnum(SwapStatus)
  status?: SwapStatus;
}

export class RejectSwapRequestDto {
  @ApiPropertyOptional({ example: 'Not available this week' })
  @IsOptional()
  @IsString()
  reason?: string;
}
