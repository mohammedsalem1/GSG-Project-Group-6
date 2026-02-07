import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UserModule } from '../user/user.module';
import { SessionModule } from '../session/session.module';
import { SwapsModule } from '../swaps/swaps.module';
import { FeedbackModule } from '../feedback/feedback.module';

@Module({
  imports: [UserModule, SessionModule, SwapsModule, FeedbackModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
