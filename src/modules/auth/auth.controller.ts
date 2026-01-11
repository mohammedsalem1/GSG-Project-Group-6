import { Body, Controller, Get, Post, Query, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfirmPasswordPipe } from './pipes/confirm-password-pipe.pipe';
import { RegisterDto, VerifyEmailDto } from './dto/auth.dto';


@ApiTags('auth')
@Controller('auth')
export class AuthController {
   constructor(private readonly authService:AuthService){}
   
   
   @Post('register')
   @UsePipes(ConfirmPasswordPipe)
   @ApiOperation({summary:"User Register"})
   @ApiOkResponse({description:"the user register successfully"})
   @ApiBadRequestResponse({description:"User already exists"})
   // TODO IsPublic('true')
   async register(@Body() registerDto:RegisterDto):Promise<string> {
       return await this.authService.register(registerDto)
   }

   @ApiOperation({summary:"Verify User"})
   @Get('verify-email')
   async verifyEmail(
      @Query()verifyEmailDto:VerifyEmailDto) {
    
      const {email , token} = verifyEmailDto
      return await this.authService.verifyEmail(email, token);
  }
}