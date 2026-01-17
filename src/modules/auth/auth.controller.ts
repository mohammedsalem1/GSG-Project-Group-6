
import {
  Body,
  Controller,
  Post,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ConfirmPasswordPipe } from './pipes/confirm-password-pipe.pipe';
import { ForgotPasswordDto, RegisterDto, ResetPasswordDto, VerifyOtpDto } from './dto/auth.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
   constructor(private readonly authService:AuthService){}
   
  @Post('register')
  @Public()
  @UsePipes(ConfirmPasswordPipe)
  @ApiOperation({ summary: 'User Register' })
  @ApiCreatedResponse({ description: 'The user registered successfully' })
  @ApiBadRequestResponse({ description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto): Promise<string> {
    return await this.authService.register(registerDto);
  }

  @Post('verify-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP' })
  @ApiOkResponse({ description: 'User verified successfully' })
  @ApiBadRequestResponse({ description: 'Invalid OTP code or OTP expired' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async verifyOtp(@Body() verifyOtp: VerifyOtpDto): Promise<string> {
    return this.authService.verifyOTP(verifyOtp.email, verifyOtp.otpCode);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User Login' })
  @ApiOkResponse({
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'Invalid credentials, account not verified, or account inactive',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
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
