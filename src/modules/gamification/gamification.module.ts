import { Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { UserModule } from '../user/user.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  providers: [GamificationService],
  controllers: [GamificationController],
  imports: [DatabaseModule, UserModule],
  exports:[GamificationService]
})
export class GamificationModule {}
