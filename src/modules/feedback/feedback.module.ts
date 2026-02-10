import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { DatabaseModule } from 'src/database/database.module';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [DatabaseModule, SessionModule],
  providers: [FeedbackService],
  controllers: [FeedbackController],
  exports: [FeedbackService],
})
export class FeedbackModule {}
