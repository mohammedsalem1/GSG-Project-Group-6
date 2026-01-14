import { Body, Controller, Get, Post, Query, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfirmPasswordPipe } from './pipes/confirm-password-pipe.pipe';
import { ForgotPasswordDto, RegisterDto, ResetPasswordDto, VerifyEmailDto, VerifyOtpDto } from './dto/auth.dto';


@ApiTags('auth')
@Controller('auth')
export class AuthController {
   constructor(private readonly authService:AuthService){}
   
   
   @Post('register')
   @UsePipes(ConfirmPasswordPipe)
   @ApiOperation({summary:"User Register"})
   @ApiCreatedResponse({description:"the user register successfully"})
   @ApiBadRequestResponse({description:"User already exists"})
   // TODO IsPublic('true')
   async register(@Body() registerDto:RegisterDto):Promise<string> {
       return await this.authService.register(registerDto)
   }

//    @ApiOperation({summary:"Verify User"})
//    @Get('verify-email')
//    async verifyEmail(
//       @Query()verifyEmailDto:VerifyEmailDto) {
    
//       const {email , token} = verifyEmailDto
//       return await this.authService.verifyEmail(email, token);
//   }


   @ApiOperation({summary:"Verify OTP"})
   @ApiOkResponse({description:"the verify User successfully"})
   @ApiInternalServerErrorResponse({description:"Internal server error"})
   @ApiBadRequestResponse({description:"the otp not correct"})
   @Post('verify-otp')
   async verifyOtp(
    @Body() verifyOtp:VerifyOtpDto
   ) {
      return this.authService.verifyOTP(verifyOtp.email , verifyOtp.otpCode)
   }

   @ApiOperation({summary:'Forgot Password'})
   @ApiOkResponse({description:"Check your email for a password reset link if this address is associated with an account."})
   @Post('forgot-password')
   async forgotPassword(
      @Body() forgotPasswordDto:ForgotPasswordDto
   ){
      const {email} = forgotPasswordDto
      console.log(email)
      return this.authService.forgotPassword(email)

   }

   @ApiOperation({summary:'Reset Password'})
   @ApiOkResponse({description:"Reset Paswword successfully"})
   @Post('reset-password')
   async resetPassword(
      @Body() resetPasswordDto:ResetPasswordDto
   ){
      return this.authService.resetPassword(resetPasswordDto)
   }
}