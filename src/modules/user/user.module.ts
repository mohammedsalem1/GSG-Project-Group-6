import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DatabaseModule } from 'src/database/database.module';
import { ImageKitService } from './services/imagekit.service';

@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [UserService, ImageKitService],
  exports: [UserService],
})
export class UserModule {}
