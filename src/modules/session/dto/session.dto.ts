import { ApiPropertyOptional } from '@nestjs/swagger';
import { SessionStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
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
