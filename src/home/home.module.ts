import { Module } from '@nestjs/common';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  BlurtingArrowEntity,
  BlurtingAnswerEntity,
  LikeEntity,
  UserEntity,
} from 'src/entities';
import { MongooseModule } from '@nestjs/mongoose';
import { Chatting, ChattingSchema } from 'src/chat/models';

@Module({
  controllers: [HomeController],
  providers: [HomeService],
  imports: [
    TypeOrmModule.forFeature([
      LikeEntity,
      BlurtingArrowEntity,
      UserEntity,
      BlurtingAnswerEntity,
    ]),
    MongooseModule.forFeature([
      { name: Chatting.name, schema: ChattingSchema },
    ]),
  ],
})
export class HomeModule {}
