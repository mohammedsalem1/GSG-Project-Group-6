import { Module } from '@nestjs/common';
import { SkillsService } from './skills.service';
import { SkillsController } from './skills.controller';
import { FeedbackModule } from '../feedback/feedback.module';

@Module({
  providers: [SkillsService],
  controllers: [SkillsController],
  exports: [SkillsService] , 
  imports:[FeedbackModule]
})
export class SkillsModule {}
