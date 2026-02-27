import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { NotificationPreferenceType } from '@prisma/client';

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({
    description: 'Enable/disable email notifications',
  })
  @IsBoolean()
  @IsOptional()
  EMAIL_NOTIFICATIONS?: boolean;

  @ApiPropertyOptional({
    description: 'Enable/disable in-app notifications',
  })
  @IsBoolean()
  @IsOptional()
  IN_APP_NOTIFICATIONS?: boolean;

  @ApiPropertyOptional({
    description: 'Enable/disable dispute alerts',
  })
  @IsBoolean()
  @IsOptional()
  DISPUTE_ALERTS?: boolean;

  @ApiPropertyOptional({
    description: 'Enable/disable report alerts',
  })
  @IsBoolean()
  @IsOptional()
  REPORT_ALERTS?: boolean;
}

export class NotificationPreferenceItemDto {
  @ApiProperty({ description: 'Preference ID' })
  id: string;

  @ApiProperty({
    description: 'Preference type',
    enum: NotificationPreferenceType,
  })
  type: NotificationPreferenceType;

  @ApiProperty({ description: 'Is enabled' })
  isEnabled: boolean;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}

export class NotificationPreferencesResponseDto {
  @ApiProperty({
    description: 'List of all notification preferences',
    type: [NotificationPreferenceItemDto],
  })
  data: NotificationPreferenceItemDto[];

  @ApiProperty({
    description: 'Summary of preferences',
    example: {
      EMAIL_NOTIFICATIONS: true,
      IN_APP_NOTIFICATIONS: true,
      DISPUTE_ALERTS: true,
      REPORT_ALERTS: true,
    },
  })
  summary: Record<string, boolean>;
}
