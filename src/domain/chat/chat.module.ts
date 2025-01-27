import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Chatting,
  ChattingSchema,
  Room,
  RoomSchema,
  SocketUser,
  SocketUserSchema,
} from './models';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { UserModule } from 'src/domain/user/user.module';
import { FcmModule } from 'src/domain/firebase/fcm.module';
import { ReportModule } from 'src/domain/report/report.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from 'src/domain/entities';

@Module({
  imports: [
    UserModule,
    ReportModule,
    FcmModule,
    MongooseModule.forFeature([
      { name: Chatting.name, schema: ChattingSchema },
      { name: Room.name, schema: RoomSchema },
      { name: SocketUser.name, schema: SocketUserSchema },
    ]),
    TypeOrmModule.forFeature([NotificationEntity]),
  ],
  providers: [ChatGateway, ChatService],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}
