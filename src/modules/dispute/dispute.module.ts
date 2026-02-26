import { Module } from '@nestjs/common';
import { DisputeController } from './dispute.controller';
import { DisputeService } from './dispute.service';
import { DatabaseModule } from 'src/database/database.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    DatabaseModule,
    UserModule, // for ImageKitService
  ],
  controllers: [DisputeController],
  providers: [DisputeService],
  exports: [DisputeService],
})
export class DisputeModule {}
