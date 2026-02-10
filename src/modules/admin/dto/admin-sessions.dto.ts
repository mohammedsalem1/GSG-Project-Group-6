import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionStatus } from '@prisma/client';
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

export class AdminSessionUserDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Username' })
  @IsString()
  @IsOptional()

  userName: string | null;

  @ApiProperty({ description: 'User profile image', nullable: true })
  @IsOptional()
  @IsString()
  image: string | null;
}

export class AdminSessionListItemDto {
  @ApiProperty({ description: 'Session ID' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Session date and time' })
  @IsDate()
  @Type(() => Date)
  scheduledAt: Date;

  @ApiProperty({ description: 'Session end time' })
  @IsDate()
  @Type(() => Date)
  endsAt: Date;

  @ApiProperty({ description: 'Session status', enum: SessionStatus })
  @IsEnum(SessionStatus)
  status: SessionStatus;

  @ApiProperty({ description: 'Skill being taught', example: 'JavaScript' })
  @IsString()
  skillName: string;

  @ApiProperty({
    description: 'Host of the session',
    type: () => AdminSessionUserDto,
  })
  @ValidateNested()
  @Type(() => AdminSessionUserDto)
  host: AdminSessionUserDto;

  @ApiProperty({
    description: 'Attendee of the session',
    type: () => AdminSessionUserDto,
  })
  @ValidateNested()
  @Type(() => AdminSessionUserDto)
  attendee: AdminSessionUserDto;

  @ApiProperty({ description: 'Session duration in minutes' })
  @IsInt()
  duration: number;
}

export class AdminSessionsSummaryDto {
  @ApiProperty({ description: 'Total completed sessions this week' })
  @IsInt()
  completed: number;

  @ApiProperty({ description: 'Total cancelled sessions this week' })
  @IsInt()
  cancelled: number;

  @ApiProperty({ description: 'Total disputed sessions this week' })
  @IsInt()
  disputed: number;
}

export class AdminSessionsListResponseDto {
  @ApiProperty({
    description: 'List of sessions',
    type: () => AdminSessionListItemDto,
    isArray: true,
  })
  @ValidateNested({ each: true })
  @Type(() => AdminSessionListItemDto)
  data: AdminSessionListItemDto[];

  @ApiProperty({
    description: 'Summary of session counts for this week',
    type: () => AdminSessionsSummaryDto,
  })
  @ValidateNested()
  @Type(() => AdminSessionsSummaryDto)
  summary: AdminSessionsSummaryDto;

  @ApiProperty({ description: 'Total number of sessions' })
  @IsInt()
  total: number;

  @ApiProperty({ description: 'Current page number' })
  @IsInt()
  page: number;

  @ApiProperty({ description: 'Number of sessions per page' })
  @IsInt()
  limit: number;
}

export class AdminSessionsQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by session ID, user name or email',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by session status',
    enum: SessionStatus,
  })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @ApiPropertyOptional({ description: 'Start date for filtering (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['newest', 'oldest'],
    default: 'newest',
  })
  @IsOptional()
  @IsString()
  sort?: 'newest' | 'oldest' = 'newest';
}

export class AdminSessionExportDto {
  @ApiProperty({
    description: 'Array of session IDs to export',
    type: [String],
    example: ['uuid1', 'uuid2'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  sessionIds: string[];
}
