import { Module } from '@nestjs/common';
import { HotTopicRepository } from './hotTopic.repository';
import { HotTopicService } from './hotTopic.service';
import { HotTopicController } from './hotTopic.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HotTopicAnswerEntity } from './entities/hotTopicAnswer.entity';
import { HotTopicAnswerLikeEntity } from './entities/hotTopicAnswerLike.entity';
import { HotTopicLikeEntity } from './entities/hotTopicLike.entity';
import { HotTopicQuestionEntity } from './entities/hotTopicQuestion.entity';
import { FcmModule } from '../firebase/fcm.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HotTopicAnswerEntity,
      HotTopicAnswerLikeEntity,
      HotTopicLikeEntity,
      HotTopicQuestionEntity,
    ]),
    FcmModule,
  ],
  controllers: [HotTopicController],
  providers: [HotTopicService, HotTopicRepository],
})
export class HotTopicModule {}
