import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RegisterDto, ResetPasswordDto } from './dto/auth.dto';
import { PrismaService } from '../../database/prisma.service';
import { UserService } from '../user/user.service';
import { compareOTP, hashOTP, hashPassword } from '../../common/utils/hash.util';
import { MailService } from '../mail/mail.service';
import { generateOtp } from 'src/common/utils/otp.util';
import { ConfigService } from '@nestjs/config';
import { UserEmailPayload } from './types/auth.types';
import { User } from '@prisma/client';
import { generateResetToken, hashResetToken } from 'src/common/utils/token.util';
@Injectable()
export class AuthService {
    constructor(
        private readonly userService:UserService, 
        private readonly mailService:MailService,
        private readonly configService:ConfigService
    ) {}
    async register(registerDto:RegisterDto):Promise<string> {
        const foundUser = await this.userService.findUserByEmail(registerDto.email);
        if (foundUser) {
            throw new BadRequestException('User already exist')            
        }
        const hashedPassword = await hashPassword(registerDto.password);

        const otp = generateOtp()
        const hashedOtp = await hashOTP(otp)
        
        const createdUser = await this.userService.create({
            userName:registerDto.userName , 
            email:registerDto.email , 
            password:hashedPassword , 
            otpCode:hashedOtp
        })

        const userEmailPayload:UserEmailPayload = {
            id : createdUser.id,
            email:createdUser.email,
            userName:createdUser.userName
        }
        await this.mailService.sendUserConfirmation(createdUser, otp) 

        return 'Your account created successfully. Please verify your email' 
    }
    // async verifyEmail(email:string , token:string):Promise<string> {
    //     const foundUser = await this.userService.findUserByEmail(email);

    //      if (!foundUser) {
    //         throw new BadRequestException('User not found')            
    //     }

    //      if (foundUser.isVerified) {
    //         return 'Email is already verified'
    //       }

    //     const isValid = verifyToken(foundUser.id,foundUser.email, token);
    //     if (!isValid) throw new BadRequestException('Invalid or expired token');

    //     await this.userService.updateVerifiedUser(email);
        

    //     return 'Email verified successfully';
    // }

    async verifyOTP(email:string , otpCode:string) {
        const foundUser = await this.userService.findUserByEmail(email)
        if (!foundUser) {
            throw new NotFoundException('the User not Found')
         } 

         if (foundUser.isVerified) {
              return 'Email is already verified'    
         }

         const otpExpiresIn  = this.configService.getOrThrow<number>('OTP_EXPIRES_IN') * 1000;
         
         if (!foundUser.otpCode || Date.now() - foundUser.otpSendAt!.getTime() > otpExpiresIn) {
            throw new BadRequestException('OTP expired')
         }

          
        const isOtpValid = await compareOTP(otpCode, foundUser.otpCode)
        if (!isOtpValid) {
            throw new BadRequestException('the otp not correct')
        }

        await this.userService.verifyUserEmail(email);
        

        return 'Email verified successfully';
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