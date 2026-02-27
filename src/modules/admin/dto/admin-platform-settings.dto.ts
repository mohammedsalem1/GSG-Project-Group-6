import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdatePlatformSettingsDto {
  @ApiProperty({
    description: 'Platform name',
    example: 'SkillSwap',
  })
  @IsString()
  @IsOptional()
  platformName?: string;

  @ApiProperty({
    description: 'Default language for the platform',
    example: 'English',
  })
  @IsString()
  @IsOptional()
  defaultLanguage?: string;

  @ApiProperty({
    description: 'Default timezone',
    example: 'UTC',
  })
  @IsString()
  @IsOptional()
  defaultTimezone?: string;

  @ApiProperty({
    description: 'Date format',
    example: 'YYYY-MM-DD',
  })
  @IsString()
  @IsOptional()
  dateFormat?: string;

  @ApiProperty({
    description: 'Platform status (LIVE, MAINTENANCE, PAUSED)',
    example: 'LIVE',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Support email address',
    example: 'support@skillswap.com',
  })
  @IsEmail()
  @IsOptional()
  supportEmail?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '+966501234567',
  })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'Social media links',
    example: {
      linkedin: 'https://linkedin.com/company/skillswap',
      twitter: 'https://twitter.com/skillswap',
      facebook: 'https://facebook.com/skillswap',
      instagram: 'https://instagram.com/skillswap',
    },
  })
  @IsOptional()
  socialLinks?: Record<string, string>;
}

export class PlatformSettingsResponseDto {
  @ApiProperty({ description: 'Platform settings ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Platform name' })
  platformName: string;

  @ApiProperty({ description: 'Default language' })
  defaultLanguage: string;

  @ApiProperty({ description: 'Default timezone' })
  defaultTimezone: string;

  @ApiProperty({ description: 'Date format' })
  dateFormat: string;

  @ApiProperty({ description: 'Platform status' })
  status: string;

  @ApiProperty({ description: 'Support email' })
  supportEmail: string;

  @ApiPropertyOptional({ description: 'Contact phone' })
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Social media links' })
  socialLinks?: Record<string, string>;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}
