import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditService } from './services/audit.service';
import { UserModule } from '../user/user.module';
import { SessionModule } from '../session/session.module';
import { SwapsModule } from '../swaps/swaps.module';
import { FeedbackModule } from '../feedback/feedback.module';
import { SkillsModule } from '../skills/skills.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [
    UserModule,
    SessionModule,
    SwapsModule,
    FeedbackModule,
    SkillsModule,
    GamificationModule
  ],
  controllers: [AdminController],
  providers: [AdminService, AuditService],
})
export class AdminModule {}
