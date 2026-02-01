import { Module } from '@nestjs/common';
import { SwapsService } from './swaps.service';
import { SwapsController } from './swaps.controller';

@Module({
  providers: [SwapsService],
  controllers: [SwapsController],
  exports:[SwapsService]
})
export class SwapsModule {}
