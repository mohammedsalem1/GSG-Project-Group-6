import { BadRequestException, Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/auth.dto';
import { PrismaService } from '../../database/prisma.service';
import { UserService } from '../user/user.service';
import { hashPassword } from '../../common/utils/hash.util';
import { generateVerifyToken, verifyToken } from 'src/common/utils/token.util';
import { MailService } from '../mail/mail.service';
@Injectable()
export class AuthService {
    constructor(
        private readonly userService:UserService, 
        private readonly mailService:MailService
    ) {}
    async register(registerDto:RegisterDto):Promise<string> {
        const foundUser = await this.userService.findUserByEmail(registerDto.email);
        if (foundUser) {
            throw new BadRequestException('User already exist')            
        }
        const hashedPassword = await hashPassword(registerDto.password);
        
        const createdUser = await this.userService.create({
            userName:registerDto.userName , 
            email:registerDto.email , 
            password:hashedPassword
        })

        const token = generateVerifyToken(createdUser.id , createdUser.email , 1)
        
        await this.mailService.sendUserConfirmation(createdUser, token) 
        return 'Your account created successfully. Please verify your email'
    }
    async verifyEmail(email:string , token:string):Promise<string> {
        const foundUser = await this.userService.findUserByEmail(email);

         if (!foundUser) {
            throw new BadRequestException('User not found')            
        }

         if (foundUser.isVerified) {
            return 'Email is already verified'
          }

        const isValid = verifyToken(foundUser.id,foundUser.email, token);
        if (!isValid) throw new BadRequestException('Invalid or expired token');

        await this.userService.updateVerifiedUser(email);
        

        return 'Email verified successfully';
  }
}