import { Module } from '@nestjs/common';
import { BlurtingController } from './blurting.controller';
import { BlurtingService } from './blurting.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  UserEntity,
  BlurtingGroupEntity,
  BlurtingQuestionEntity,
  BlurtingAnswerEntity,
  BLurtingArrowEntity,
  LikeEntity,
  NotificationEntity,
} from 'src/entities';
import { UserModule } from 'src/user/user.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { BullModule } from '@nestjs/bull';
import { BlurtingConsumer } from './blurting.consumer';
import { FcmModule } from 'src/firebase/fcm.module';
import { ChatModule } from 'src/chat/chat.module';
import { PointModule } from 'src/point/point.module';
import { ReportEntity } from 'src/entities/report.entity';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([
      UserEntity,
      BlurtingGroupEntity,
      BlurtingQuestionEntity,
      BlurtingAnswerEntity,
      BLurtingArrowEntity,
      LikeEntity,
      ReportEntity,
      NotificationEntity,
    ]),
    CacheModule.register({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      store: async () =>
        await redisStore({
          socket: {
            host: 'localhost',
            port: 6379,
          },
        }),
    }),
    BullModule.registerQueue({
      name: 'blurtingQuestions',
      settings: {
        stalledInterval: 1000,
        maxStalledCount: 3,
        retryProcessDelay: 5000,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: 3,
        removeOnComplete: true,
      },
    }),
    FcmModule,
    ChatModule,
    PointModule,
  ],
  controllers: [BlurtingController],
  providers: [BlurtingService, BlurtingConsumer],
})
export class BlurtingModule {}
