import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto  {
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
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    { message: 'Password too weak' },
  )
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
    email:string

    @ApiProperty({ example: 'hifewfuweuijfhuicwuceyicheygfbvicldsadc' })
    @IsNotEmpty()
    @Matches(/^[a-f0-9]+\.\d+$/, { message: 'Invalid token format' })
    @IsString()
    token:string
}

export class VerifyOtpDto {
    @ApiProperty({ example: 'mohammed@gmail.com' })
    @IsNotEmpty()
    @IsEmail()
    email:string

    @ApiProperty({ example: '654328' })
    @IsNotEmpty()
    @IsString()
    otpCode:string
}
export class ForgotPasswordDto {
  @ApiProperty({ example: 'mohammed@gmail.com' })
    @IsNotEmpty()
    @IsEmail()
    email:string
}

export class ResetPasswordDto {
    @ApiProperty({ example: '59626b92f3a7930812fe4d6677769668e1c9e95002b0f1d80aaa732bccd4d113.681e870d-39d6-4c0c-867b-2d0b1ce4628b' })
    @IsNotEmpty()
    @IsString()
    token:string

    @ApiProperty({ example: 'P@ssw0rd!' })
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
     { message: 'Password too weak' },
    )
    newPassword: string;
}
