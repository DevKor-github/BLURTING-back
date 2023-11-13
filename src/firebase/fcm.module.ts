import { Module } from '@nestjs/common';
import { FcmService } from './fcm.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SocketUser, SocketUserSchema } from 'src/chat/models';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SocketUser.name, schema: SocketUserSchema },
    ]),
  ],
  providers: [FcmService],
  exports: [FcmService],
})
export class FcmModule {}
