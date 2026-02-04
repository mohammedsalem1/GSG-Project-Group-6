import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'mohammed' })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  userName: string;

  @ApiProperty({ example: 'user@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'P@ssw0rd!' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'Password too weak',
  })
  password: string;

  @ApiProperty({ example: 'P@ssw0rd!', writeOnly: true })
  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}
export class VerifyEmailDto {
  @ApiProperty({ example: 'mohammed@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'hifewfuweuijfhuicwuceyicheygfbvicldsadc' })
  @IsNotEmpty()
  @Matches(/^[a-f0-9]+\.\d+$/, { message: 'Invalid token format' })
  @IsString()
  token: string;
}

export enum OtpType {
  VERIFY_EMAIL = 'VERIFY_EMAIL',
  RESET_PASSWORD = 'RESET_PASSWORD',
}
export class VerifyOtpDto {
  @ApiProperty({ example: 'mohammed@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '654328' })
  @IsNotEmpty()
  @IsString()
  otpCode: string;
   
  @ApiProperty({
    example: OtpType.VERIFY_EMAIL,
    description: `Type of OTP. Allowed values:
         - VERIFY_EMAIL
         - RESET_PASSWORD`,
   })
  @IsEnum(OtpType)
  @IsNotEmpty()
  type: OtpType;
}
export class ForgotPasswordDto {
  @ApiProperty({ example: 'mohammed@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'mohammed@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;


  @ApiProperty({ example: 'P@ssw0rd!' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'Password too weak',
  })
  password: string;

  @ApiProperty({ example: 'P@ssw0rd!', writeOnly: true })
  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token obtained during login',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty({ message: 'Refresh token is required' })
  @IsString({ message: 'Refresh token must be a string' })
  refreshToken: string;
}
