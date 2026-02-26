import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DatabaseModule } from 'src/database/database.module';
import { ImageKitService } from './services/imagekit.service';
import { FeedbackModule } from '../feedback/feedback.module';
import { SkillsModule } from '../skills/skills.module';

@Module({
  imports: [DatabaseModule, FeedbackModule, SkillsModule],
  controllers: [UserController],
  providers: [UserService, ImageKitService],
  exports: [UserService, ImageKitService],
})
export class UserModule {}
