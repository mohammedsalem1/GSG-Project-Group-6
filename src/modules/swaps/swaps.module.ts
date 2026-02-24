import { Module } from '@nestjs/common';
import { SwapsService } from './swaps.service';
import { SwapsController } from './swaps.controller';
import { UserModule } from '../user/user.module';

@Module({
  controllers: [SwapsController],
  providers: [SwapsService],
  exports: [SwapsService],
  imports:[UserModule]
})
export class SwapsModule {}
