import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Availability } from '@prisma/client';

export const VALID_TIMEZONES = [
  'UTC',
  'Asia/Jerusalem',
  'Asia/Amman',
  'Asia/Riyadh',
  'Asia/Dubai',
  'Asia/Kuwait',
  'Asia/Baghdad',
  'Asia/Beirut',
  'Asia/Cairo',
  'Africa/Casablanca',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Istanbul',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Pacific/Auckland',
] as const;

export type ValidTimezone = (typeof VALID_TIMEZONES)[number];

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'mohammed' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  userName: string;

  @ApiPropertyOptional({
    example: 'I am a passionate web developer with 5 years of experience...',
    description: 'User biography/about section',
    minLength: 10,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Bio must be at least 10 characters' })
  @MaxLength(500, { message: 'Bio cannot exceed 500 characters' })
  bio?: string;

  // @ApiPropertyOptional({
  //   example: 'Palestine',
  //   description: 'Country name',
  // })
  // @IsOptional()
  // @IsString()
  // @MinLength(2)
  // @MaxLength(100)
  // country?: string;

  @ApiPropertyOptional({
    example: 'Ramallah',
    description: 'City or location',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({
    example: 'Asia/Jerusalem',
    description: 'Timezone (must be a valid IANA timezone)',
    enum: VALID_TIMEZONES,
  })
  @IsOptional()
  @IsEnum(VALID_TIMEZONES, {
    message: `Timezone must be one of: ${VALID_TIMEZONES.join(', ')}`,
  })
  timezone?: ValidTimezone;

  @ApiPropertyOptional({
    enum: Availability,
    example: Availability.FLEXIBLE,
    description: 'When the user is available for skill swaps',
  })
  @IsOptional()
  @IsEnum(Availability, { message: 'Invalid availability option' })
  availability?: Availability;

  @ApiPropertyOptional({
    example: '+970591234567',
    description: 'Phone number',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
