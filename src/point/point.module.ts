import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointHistoryEntity, UserEntity } from 'src/entities';
import { PointController } from './point.controller';
import { PointService } from './point.service';
import { ChatModule } from 'src/chat/chat.module';
import { ReportModule } from 'src/report/report.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, PointHistoryEntity]),
    ChatModule,
    ReportModule,
  ],
  controllers: [PointController],
  providers: [PointService],
  exports: [PointService],
})
export class PointModule {}
