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