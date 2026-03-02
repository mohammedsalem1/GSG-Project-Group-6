import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class GetSessionsQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: SessionStatus,
    example: SessionStatus.SCHEDULED,
    description: 'Filter by session status',
  })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @ApiPropertyOptional({
    example: '2026-02',
    description: 'Filter by month (YYYY-MM format)',
  })
  @IsOptional()
  @IsString()
  month?: string;
}

export class CompleteSessionDto {
  @ApiPropertyOptional({
    example: 'Great session! Learned a lot about React hooks.',
    description: 'Optional notes about the completed session',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CancelSessionDto {
  @ApiPropertyOptional({
    example: 'Unexpected work emergency',
    description: 'Optional reason for cancellation',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}


export class RescheduleSessionDto {
  @ApiProperty({ example: '2026-02-04' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @ApiProperty({ example: '14:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startAt: string;

  @ApiProperty({ example: '15:30' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  endAt: string;
}
