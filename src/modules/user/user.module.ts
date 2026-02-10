import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DatabaseModule } from 'src/database/database.module';
import { ImageKitService } from './services/imagekit.service';
import { FeedbackModule } from '../feedback/feedback.module';

@Module({
  imports: [DatabaseModule, FeedbackModule],
  controllers: [UserController],
  providers: [UserService, ImageKitService],
  exports: [UserService],
})
export class UserModule {}
