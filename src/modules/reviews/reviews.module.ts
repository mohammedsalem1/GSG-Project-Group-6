import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { SwapsModule } from '../swaps/swaps.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  providers: [ReviewsService],
  controllers: [ReviewsController],
  exports:[ReviewsService],
  imports:[SwapsModule , GamificationModule]
})
export class ReviewsModule {}
