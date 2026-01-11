import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/user.dto';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prismaService:PrismaService){}
  create(createUserDto: CreateUserDto) {
    return this.prismaService.user.create({data:createUserDto});
  }
  findUserByEmail(email:string) {
    return this.prismaService.user.findUnique({where:{email}})
  }
  updateVerifiedUser(email:string) {
     return this.prismaService.user.update({
      where:{email},
      data:{
        isVerified:true
      }
     })  
  }
}
