import { UserEntity } from 'src/domain/entities';
import {
  PrimaryColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';
import { HotTopicQuestionEntity } from './hotTopicQuestion.entity';

@Entity('hot_topic_like')
export class HotTopicLikeEntity {
  @ManyToOne(() => UserEntity, () => undefined, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @RelationId((hotTopicLike: HotTopicLikeEntity) => hotTopicLike.user)
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => HotTopicQuestionEntity, () => undefined, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'hot_topic_id' })
  hotTopic: HotTopicQuestionEntity;

  @RelationId((hotTopicLike: HotTopicLikeEntity) => hotTopicLike.hotTopic)
  @PrimaryColumn({ name: 'hot_topic_id' })
  hotTopicId: number;
}
