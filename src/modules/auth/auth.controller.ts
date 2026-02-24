import {
  Body,
  Controller,
  Post,
  UsePipes,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ConfirmPasswordPipe } from './pipes/confirm-password-pipe.pipe';
import {
  ForgotPasswordDto,
  OtpType,
  RefreshTokenDto,
  RegisterDto,
  ResendOtpDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './dto/auth.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { RequestUser } from 'src/common/types/user.types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @UsePipes(ConfirmPasswordPipe)
  @ApiOperation({ summary: 'User Register' })
  @ApiCreatedResponse({ description: 'The user registered successfully' })
  @ApiBadRequestResponse({ description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto): Promise<string> {
    return await this.authService.register(registerDto);
  }
  
  @Public()
  @Get('otp-types')
  @ApiOperation({ summary: 'Get allowed OTP types' })

  getOtpTypes() {
     return Object.values(OtpType);
  }


  @Post('verify-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP' })
  @ApiOkResponse({ description: 'User verified successfully' })
  @ApiBadRequestResponse({ description: 'Invalid OTP code or OTP expired' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })

  async verifyOtp(@Body() verifyOtp: VerifyOtpDto) {
    return this.authService.verifyOTP(verifyOtp);
  }

  @Public()
  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend OTP' })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Resend otp successfully' })
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto.email, dto.type);
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

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset code' })
  @ApiOkResponse({
    description: 'A password reset code has been sent to the email if it exists',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Reset code sent successfully' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'User not verified' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    console.log(email);
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  @Public()
  @UsePipes(ConfirmPasswordPipe)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset user password using reset code' })
  @ApiOkResponse({
    description: 'Password has been reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password reset successfully' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid input data or weak password' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }


  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'User Logout' })
  @ApiNoContentResponse({
    description: 'Logout successful',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing token',
  })
  async logout(@CurrentUser() user: RequestUser): Promise<void> {
    await this.authService.logout(user.id);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh Access Token' })
  @ApiOkResponse({
    description: 'New access token generated successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        expiresIn: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid or missing refresh token',
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token expired or revoked',
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
  }
}