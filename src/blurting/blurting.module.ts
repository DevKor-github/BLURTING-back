import { Module } from '@nestjs/common';
import { BlurtingController } from './blurting.controller';
import { BlurtingService } from './blurting.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  BlurtingGroupEntity,
  BlurtingQuestionEntity,
  BlurtingAnswerEntity,
  BlurtingArrowEntity,
  LikeEntity,
  NotificationEntity,
  ReplyEntity,
  BlurtingPreQuestionEntity,
  ReportEntity,
} from 'src/entities';
import { UserModule } from 'src/user/user.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { BullModule } from '@nestjs/bull';
import { BlurtingConsumer } from './blurting.consumer';
import { FcmModule } from 'src/firebase/fcm.module';
import { ChatModule } from 'src/chat/chat.module';
import { PointModule } from 'src/point/point.module';
import {
  BlurtingAnswerRepository,
  BlurtingArrowRepository,
  BlurtingGroupRepository,
  BlurtingLikeRepository,
  BlurtingPreQuestionRepository,
  BlurtingQuestionRepository,
  BlurtingReplyRepository,
  NotificationRepository,
  ReportRepository,
} from 'src/repositories';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([
      BlurtingGroupEntity,
      BlurtingQuestionEntity,
      BlurtingAnswerEntity,
      BlurtingArrowEntity,
      LikeEntity,
      ReportEntity,
      NotificationEntity,
      ReplyEntity,
      BlurtingPreQuestionEntity,
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
    BullModule.registerQueue({
      name: 'renewaledBlurting',
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
  providers: [
    BlurtingService,
    BlurtingConsumer,
    BlurtingAnswerRepository,
    BlurtingArrowRepository,
    BlurtingGroupRepository,
    BlurtingPreQuestionRepository,
    BlurtingQuestionRepository,
    BlurtingReplyRepository,
    BlurtingLikeRepository,
    NotificationRepository,
    ReportRepository,
  ],
  exports: [BlurtingService],
})
export class BlurtingModule {}
