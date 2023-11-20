import { Module } from '@nestjs/common';
import { BlurtingController } from './blurting.controller';
import { BlurtingService } from './blurting.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  UserEntity,
  BlurtingGroupEntity,
  BlurtingQuestionEntity,
  BlurtingAnswerEntity,
} from 'src/entities';
import { UserModule } from 'src/user/user.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { BullModule } from '@nestjs/bull';
import { BlurtingConsumer } from './blurting.consumer';
@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([
      UserEntity,
      BlurtingGroupEntity,
      BlurtingQuestionEntity,
      BlurtingAnswerEntity,
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
    }),
  ],
  controllers: [BlurtingController],
  providers: [BlurtingService, BlurtingConsumer],
})
export class BlurtingModule {}
