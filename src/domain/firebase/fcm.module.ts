import { Module } from '@nestjs/common';
import { FcmService } from './fcm.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SocketUser, SocketUserSchema } from 'src/domain/chat/models';
import { fcmController } from './fcm.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from 'src/domain/entities';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SocketUser.name, schema: SocketUserSchema },
    ]),
    TypeOrmModule.forFeature([NotificationEntity]),
  ],
  controllers: [fcmController],
  providers: [FcmService],
  exports: [FcmService],
})
export class FcmModule {}
