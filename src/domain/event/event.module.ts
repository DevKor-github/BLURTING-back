import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { redisStore } from 'cache-manager-redis-store';
import {
  BlurtingArrowEntity,
  BlurtingAnswerEntity,
  BlurtingEventEntity,
  BlurtingGroupEntity,
  BlurtingQuestionEntity,
  UserEntity,
} from 'src/domain/entities';
import { FcmModule } from 'src/domain/firebase/fcm.module';
import { UserModule } from 'src/domain/user/user.module';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { BlurtingModule } from 'src/domain/blurting/blurting.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BlurtingGroupEntity,
      BlurtingEventEntity,
      BlurtingQuestionEntity,
      BlurtingAnswerEntity,
      BlurtingArrowEntity,
      UserEntity,
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
    UserModule,
    BlurtingModule,
  ],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}