import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SwapStatus } from '@prisma/client';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDate,
  IsInt,
  IsEnum,
  ValidateNested,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class AdminSwapUserDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Username' })
  @IsString()
  userName: string;

  @ApiProperty({ description: 'User profile image', nullable: true })
  @IsOptional()
  @IsString()
  image: string | null;
}

export class AdminSwapSkillDto {
  @ApiProperty({ description: 'Skill ID' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Skill name' })
  @IsString()
  name: string;
}

export class AdminSwapListItemDto {
  @ApiProperty({ description: 'Swap request ID' })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Sender/Requester',
    type: () => AdminSwapUserDto,
  })
  @ValidateNested()
  @Type(() => AdminSwapUserDto)
  sender: AdminSwapUserDto;

  @ApiProperty({ description: 'Receiver', type: () => AdminSwapUserDto })
  @ValidateNested()
  @Type(() => AdminSwapUserDto)
  receiver: AdminSwapUserDto;

  @ApiProperty({ description: 'Request type', example: 'Skill Swap' })
  @IsString()
  requestType: string;

  @ApiProperty({
    description: 'Requested skill',
    type: () => AdminSwapSkillDto,
  })
  @ValidateNested()
  @Type(() => AdminSwapSkillDto)
  requestedSkill: AdminSwapSkillDto;

  @ApiProperty({
    description: 'Offered skill',
    type: () => AdminSwapSkillDto,
    nullable: true,
  })
  @ValidateNested()
  @Type(() => AdminSwapSkillDto)
  offeredSkill: AdminSwapSkillDto | null;

  @ApiProperty({ description: 'Swap status', enum: SwapStatus })
  @IsEnum(SwapStatus)
  status: SwapStatus;

  @ApiProperty({ description: 'Session date and time' })
  @IsDate()
  dateTime: Date;
}

export class AdminSwapsSummaryDto {
  @ApiProperty({ description: 'Total accepted swaps' })
  @IsInt()
  accepted: number;

  @ApiProperty({ description: 'Total pending swaps' })
  @IsInt()
  pending: number;

  @ApiProperty({ description: 'Total rejected swaps' })
  @IsInt()
  rejected: number;
}

export class AdminSwapsListResponseDto {
  @ApiProperty({
    description: 'List of swaps',
    type: () => AdminSwapListItemDto,
    isArray: true,
  })
  @ValidateNested({ each: true })
  @Type(() => AdminSwapListItemDto)
  data: AdminSwapListItemDto[];

  @ApiProperty({
    description: 'Summary of swap counts',
    type: () => AdminSwapsSummaryDto,
  })
  @ValidateNested()
  @Type(() => AdminSwapsSummaryDto)
  summary: AdminSwapsSummaryDto;

  @ApiProperty({ description: 'Total count of swaps' })
  @IsInt()
  total: number;

  @ApiProperty({ description: 'Current page' })
  @IsInt()
  page: number;

  @ApiProperty({ description: 'Limit per page' })
  @IsInt()
  limit: number;
}

export class AdminSwapsQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: SwapStatus,
    description: 'Filter by swap status',
  })
  @IsOptional()
  @IsEnum(SwapStatus)
  status?: SwapStatus;

  @ApiPropertyOptional({
    enum: ['newest', 'oldest'],
    default: 'newest',
    description: 'Sort by creation date',
  })
  @IsOptional()
  @IsString()
  sort?: 'newest' | 'oldest';

  @ApiPropertyOptional({
    description: 'Start date for range filter (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for range filter (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class AdminSwapExportDto {
  @ApiProperty({
    description: 'Array of swap IDs to export',
    type: [String],
    format: 'uuid',
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  swapIds: string[];
}
