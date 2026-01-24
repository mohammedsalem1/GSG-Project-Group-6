import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  IsPhoneNumber,
} from 'class-validator';
import { Availability } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: '+970599123456',
    description: 'Phone number with country code',
  })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number' })
  phoneNumber?: string;

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

  @ApiPropertyOptional({
    example: 'Palestine',
    description: 'Country name',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  country?: string;

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
    description: 'Timezone (IANA format)',
    default: 'UTC',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    enum: Availability,
    example: Availability.FLEXIBLE,
    description: 'When the user is available for skill swaps',
  })
  @IsOptional()
  @IsEnum(Availability, { message: 'Invalid availability option' })
  availability?: Availability;
}
