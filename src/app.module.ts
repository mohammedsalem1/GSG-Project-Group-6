import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { SkillsModule } from './modules/skills/skills.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import jwtConfig from './config/jwt.config';
import imagekitConfig from './config/imagekit.config';
import { ScheduleModule } from '@nestjs/schedule';
import { SwapsModule } from './modules/swaps/swaps.module';
import { SessionModule } from './modules/session/session.module';
import { AdminModule } from './modules/admin/admin.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { GamificationModule } from './modules/gamification/gamification.module';

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
    ReviewsModule,
    FeedbackModule,
    SessionModule,
    AdminModule,
    GamificationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
