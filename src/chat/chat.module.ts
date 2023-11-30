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
import { UserModule } from 'src/user/user.module';
import { FcmModule } from 'src/firebase/fcm.module';
import { ReportModule } from 'src/report/report.module';

@Module({
  imports: [
    UserModule,
    ReportModule,
    FcmModule,
    ReportModule,
    MongooseModule.forFeature([
      { name: Chatting.name, schema: ChattingSchema },
      { name: Room.name, schema: RoomSchema },
      { name: SocketUser.name, schema: SocketUserSchema },
    ]),
  ],
  providers: [ChatGateway, ChatService],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}
