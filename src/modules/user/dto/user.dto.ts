import { ApiProperty, PartialType } from '@nestjs/swagger';
import { RegisterDto } from '../../auth/dto/auth.dto';
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
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

      @IsNotEmpty()
      @IsString()
      otpCode:string

      otpSendAt:Date
}

