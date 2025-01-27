import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { HotTopicAnswerEntity } from './hotTopicAnswer.entity';
import { HotTopicLikeEntity } from './hotTopicLike.entity';

@Entity('hot_topic_question')
export class HotTopicQuestionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  createdBy: string;

  @Column()
  question: string;

  @OneToMany(() => HotTopicAnswerEntity, (answer) => answer.question)
  answers: HotTopicAnswerEntity[];
  @OneToMany(() => HotTopicLikeEntity, (e) => e.hotTopic)
  likes: HotTopicLikeEntity[];
}
