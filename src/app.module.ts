import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { SkillsModule } from './modules/skills/skills.module';
import { SwapsModule } from './modules/swaps/swaps.module';
import jwtConfig from './config/jwt.config';
import imagekitConfig from './config/imagekit.config';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, imagekitConfig],
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UserModule,
    SkillsModule,
    SwapsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
