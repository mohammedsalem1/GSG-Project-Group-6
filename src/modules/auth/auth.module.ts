import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EnvVariables } from 'src/common/types/declaration-mergin';

@Module({
  imports:[
    JwtModule.registerAsync({
      global:true,
      inject:[ConfigService],
      useFactory:(configService:ConfigService<EnvVariables>) => ({
        secret:configService.getOrThrow('JWT_SECRET'),
        signOptions:{expiresIn:configService.getOrThrow('JWT_EXPIRES_IN')}
      })
    })
  ],
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthModule {}
