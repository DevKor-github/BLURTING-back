import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointHistoryEntity, UserEntity } from 'src/domain/entities';
import { PointController } from './point.controller';
import { PointService } from './point.service';
import { ChatModule } from 'src/domain/chat/chat.module';
import { ReportModule } from 'src/domain/report/report.module';
import { UserModule } from 'src/domain/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, PointHistoryEntity]),
    ChatModule,
    ReportModule,
    UserModule,
  ],
  controllers: [PointController],
  providers: [PointService],
  exports: [PointService],
})
export class PointModule {}
