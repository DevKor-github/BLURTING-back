import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointHistoryEntity, UserEntity } from 'src/entities';
import { PointController } from './point.controller';
import { PointService } from './point.service';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, PointHistoryEntity]),
    ChatModule,
  ],
  controllers: [PointController],
  providers: [PointService],
  exports: [PointService],
})
export class PointModule {}
