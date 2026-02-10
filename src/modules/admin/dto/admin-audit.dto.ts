import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsDate,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AdminAuditLogDto {
  @ApiProperty({ description: 'Audit log ID' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Timestamp of the action' })
  @IsDate()
  timestamp: Date;

  @ApiProperty({ description: 'Action performed', example: 'Delete' })
  @IsString()
  action: string;

  @ApiProperty({ description: 'Entity type', example: 'Skill' })
  @IsString()
  entity: string;

  @ApiProperty({
    description: 'Details of the action',
    example: 'Skill "React Basics" deleted',
  })
  @IsString()
  details: string;

  @ApiProperty({
    description: 'Action status',
    enum: ['SUCCESS', 'FAILED'],
    example: 'SUCCESS',
  })
  @IsString()
  status: string;
}

export class AdminAuditLogsListResponseDto {
  @ApiProperty({
    description: 'List of audit logs',
    type: () => AdminAuditLogDto,
    isArray: true,
  })
  @ValidateNested({ each: true })
  @Type(() => AdminAuditLogDto)
  data: AdminAuditLogDto[];

  @ApiProperty({ description: 'Total count of audit logs' })
  @IsInt()
  total: number;

  @ApiProperty({ description: 'Current page' })
  @IsInt()
  page: number;

  @ApiProperty({ description: 'Limit per page' })
  @IsInt()
  limit: number;
}
