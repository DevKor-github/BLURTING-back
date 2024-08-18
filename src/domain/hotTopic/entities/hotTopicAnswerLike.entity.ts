import { UserEntity } from 'src/domain/entities';
import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  RelationId,
} from 'typeorm';
import { HotTopicAnswerEntity } from './hotTopicAnswer.entity';

@Entity('hot_topic_answer_like')
export class HotTopicAnswerLikeEntity {
  @ManyToOne(() => UserEntity, () => undefined, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @RelationId((hotTopicLike: HotTopicAnswerLikeEntity) => hotTopicLike.user)
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => HotTopicAnswerEntity, () => undefined, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'hot_topic_answer_id' })
  answer: HotTopicAnswerEntity;

  @RelationId((hotTopicLike: HotTopicAnswerLikeEntity) => hotTopicLike.answer)
  @PrimaryColumn({ name: 'hot_topic_answer_id' })
  answerId: number;
}
