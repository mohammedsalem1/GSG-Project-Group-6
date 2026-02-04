import { Module } from '@nestjs/common';
import { SwapsService } from './swaps.service';
import { SwapsController } from './swaps.controller';

@Module({
  controllers: [SwapsController],
  providers: [SwapsService],
  exports: [SwapsService],
})
export class SwapsModule {}
