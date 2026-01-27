import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/user.dto';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}
  create(createUserDto: CreateUserDto) {
    return this.prismaService.user.create({ data: createUserDto });
  }
  findUserByEmail(email: string) {
    return this.prismaService.user.findUnique({ where: { email } });
  }
  verifyUserEmail(email: string) {
    return this.prismaService.user.update({
      where: { email },
      data: {
        isVerified: true,
        otpCode: null,
        otpSendAt: null,
      },
    });
  }

  updateOtp(hashedOtp: string, email: string) {
    return this.prismaService.user.update({
      where: { email },
      data: {
        otpCode: hashedOtp,
        otpSendAt: new Date(),
      },
    });
  }
  findUserByToken(token: string) {
    return this.prismaService.user.findFirst({
      where: {
        otpCode: token,
      },
    });
  }
  updatePasswordAndClearOtp(email: string, newPassword: string) {
    return this.prismaService.user.update({
      where: { email },
      data: {
        password: newPassword,
        otpCode: null,
        otpSendAt: null,
      },
    });
  }
  async updateUserSelectedCategories(
  userId: string,
  selectedCatIds: string[],
) {
  const uniqueIds = [...new Set(selectedCatIds)];
  const categories = await this.prismaService.category.findMany({
    where: {
      id: { in: uniqueIds },
    },
    select: { id: true },
  });

  if (categories.length !== uniqueIds.length) {
    const foundIds = new Set(categories.map(c => c.id));
    const notFoundIds = uniqueIds.filter(id => !foundIds.has(id));

    throw new BadRequestException({
      message: 'Some category IDs were not found',
      notFoundIds,
    });
  }

  return this.prismaService.user.update({
    where: { id: userId },
    data: {
      selectedCatIds: uniqueIds.join(','),
    },
    select: {
      id:true , 
      userName:true,
      selectedCatIds:true
    }
  });
 }
}
