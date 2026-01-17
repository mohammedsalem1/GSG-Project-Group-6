/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/database/prisma.service';
import { UserService } from 'src/modules/user/user.service';
import { MailService } from 'src/modules/mail/mail.service';
import { RegisterDto, ResetPasswordDto } from './dto/auth.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { RequestUser } from 'src/common/types/user.types';
import { TokenType } from '@prisma/client';
import {
  hashPassword,
  comparePassword,
  hashOTP,
  compareOTP,
} from 'src/common/utils/hash.util';
import { generateOtp } from 'src/common/utils/otp.util';
import { generateResetToken, hashResetToken } from 'src/common/utils/token.util';
import { UserEmailPayload } from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * User Registration
   */
  async register(registerDto: RegisterDto): Promise<string> {
    const foundUser = await this.userService.findUserByEmail(registerDto.email);

    if (foundUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await hashPassword(registerDto.password);
    const otp = generateOtp();
    const hashedOtp = await hashOTP(otp);

    const createdUser = await this.userService.create({
      userName: registerDto.userName,
      email: registerDto.email,
      password: hashedPassword,
      otpCode: hashedOtp,
    });

    await this.mailService.sendUserConfirmation(createdUser, otp);

    return 'Your account created successfully. Please verify your email';
  }

  /**
   * Verify OTP
   */
  async verifyOTP(email: string, otpCode: string): Promise<string> {
    const foundUser = await this.userService.findUserByEmail(email);

    if (!foundUser) {
      throw new NotFoundException('User not found');
    }

    if (foundUser.isVerified) {
      return 'Email is already verified';
    }

    const otpExpiresIn =
      this.configService.getOrThrow<number>('OTP_EXPIRES_IN') * 1000;

    if (
      !foundUser.otpCode ||
      !foundUser.otpSendAt ||
      Date.now() - foundUser.otpSendAt.getTime() > otpExpiresIn
    ) {
      throw new BadRequestException('OTP expired');
    }

    const isOtpValid = await compareOTP(otpCode, foundUser.otpCode);

    if (!isOtpValid) {
      throw new BadRequestException('Invalid OTP code');
    }

    await this.userService.verifyUserEmail(email);

    return 'Email verified successfully';
  }

  /**
   * User Login
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        userName: true,
        email: true,
        password: true,
        role: true,
        image: true,
        isActive: true,
        isVerified: true,
      },
    });

    // Check if user exists
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated');
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    // Compare passwords
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens({
      sub: user.id,
      email: user.email,
      userName: user.userName,
      role: user.role,
    });

    // Save refresh token to database
    await this.saveRefreshToken(user.id, refreshToken);

    // Return response (exclude password)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword as UserResponseDto,
      expiresIn: this.configService.get<string>('jwt.expiresIn') ?? '1d',
    };
  }

  /**
   * Generate Access and Refresh Tokens
   */
  /**
   * Generate Access and Refresh Tokens
   */
  private async generateTokens(payload: JwtPayload): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const accessSecret = this.configService.get<string>('jwt.secret');
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');

    if (!accessSecret || !refreshSecret) {
      throw new Error('JWT secrets are not configured');
    }

    // Create payload object (ensures compatibility)
    const tokenPayload = {
      sub: payload.sub,
      email: payload.email,
      userName: payload.userName,
      role: payload.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      // Access token (uses default expiresIn from module config)
      this.jwtService.signAsync(tokenPayload),

      // Refresh token (override with refresh secret and expiry)
      this.jwtService.signAsync(tokenPayload, {
        secret: refreshSecret,
        expiresIn: '7d', // ✅ Hardcoded string literal works
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Save Refresh Token to Database
   */
  private async saveRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Save to database
    await this.prisma.userToken.create({
      data: {
        userId,
        token: refreshToken,
        type: TokenType.REFRESH_TOKEN,
        expiresAt,
      },
    });
  }

  /**
   * Validate User (used by JWT strategy)
   */
  async validateUser(userId: string): Promise<RequestUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        userName: true,
        role: true,
        isActive: true,
        isVerified: true,
      },
    });

    if (!user || !user.isActive || !user.isVerified) {
      return null;
    }

    return user as RequestUser;
  }

      async forgotPassword(email:string):Promise<string> {
        const foundUser = await this.userService.findUserByEmail(email)

        if (!foundUser) {
            throw new NotFoundException('User not found')
        }

        if (!foundUser.isVerified) {
            throw new BadRequestException('user not verified')
        }
        // generate HashKey and store in otpCode 
        const resetToken =  generateResetToken()
        const hashedResetToken =  hashResetToken(resetToken)
        
        await  this.userService.savePasswordResetToken(hashedResetToken  , email)

        const userEmailPayload:UserEmailPayload = {
            id : foundUser.id,
            email:foundUser.email,
            userName:foundUser.userName
        }

        await this.mailService.sendPasswordResetEmail(userEmailPayload , resetToken) 

        return 'Password reset email sent successfully'
    }
    async resetPassword(resetPasswordDto:ResetPasswordDto):Promise<string> {
        const { token , newPassword} = resetPasswordDto;
        
        const hashedResetToken = hashResetToken(token) 
        const foundUser = await this.userService.findUserByToken(hashedResetToken)


        if (!foundUser) {
            throw new BadRequestException('This token does not belong to any user')
        }

        const hashedPassword = await hashPassword(newPassword)
        await this.userService.updatePasswordAndClearOtp(foundUser.email , hashedPassword)

        return 'Password reset successfully'
    }

}

