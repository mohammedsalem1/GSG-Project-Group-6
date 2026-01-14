import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RegisterDto } from './dto/auth.dto';
import { PrismaService } from '../../database/prisma.service';
import { UserService } from '../user/user.service';
import { compareOTP, hashOTP, hashPassword } from '../../common/utils/hash.util';
import { generateVerifyToken, verifyToken } from 'src/common/utils/token.util';
import { MailService } from '../mail/mail.service';
import { generateOtp } from 'src/common/utils/otp.util';
import { ConfigService } from '@nestjs/config';
import { EnvVariables } from 'src/common/types/declaration-mergin';
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
         const otpExpiresIn  = this.configService.getOrThrow<number>('OTP_EXPIRES_IN') * 1000;
         
         if (!foundUser.otpCode || Date.now() - foundUser.otpSendAt!.getTime() > otpExpiresIn) {
            throw new BadRequestException('OTP expired')
         }

        if (foundUser.isVerified) {
              return 'Email is already verified'    
         }  
         
        const isOtpValid = await compareOTP(otpCode, foundUser.otpCode)
        if (!isOtpValid) {
            throw new BadRequestException('the otp not correct')
        }

        await this.userService.verifyUserEmail(email);
        

        return 'Email verified successfully';
    }
}
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {}
