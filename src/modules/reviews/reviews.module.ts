import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { SwapsModule } from '../swaps/swaps.module';

@Module({
  providers: [ReviewsService],
  controllers: [ReviewsController],
  exports:[ReviewsService],
  imports:[SwapsModule]
})
export class ReviewsModule {}
