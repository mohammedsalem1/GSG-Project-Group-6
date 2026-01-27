import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { DatabaseModule } from 'src/database/database.module';
import { UserModule } from 'src/modules/user/user.module';
import { MailModule } from 'src/modules/mail/mail.module';
import jwtConfig from 'src/config/jwt.config';

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>('jwt.secret');
        const expiresIn = configService.get<string>('jwt.expiresIn');

        if (!secret) {
          throw new Error(
            'JWT_SECRET is not configured in environment variables',
          );
        }

        if (!expiresIn) {
          throw new Error(
            'JWT_EXPIRES_IN is not configured in environment variables',
          );
        }

        return {
          secret,
          signOptions: {
            expiresIn,
          },
        } as JwtModuleOptions; // ✅ Explicit type assertion
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
