import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { HotTopicQuestionEntity } from './hotTopicQuestion.entity';
import { UserEntity } from 'src/domain/entities';
import { HotTopicAnswerLikeEntity } from './hotTopicAnswerLike.entity';

@Entity('hot_topic_answer')
export class HotTopicAnswerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  answer: string;

  @ManyToOne(() => HotTopicQuestionEntity, (question) => question.answers, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  question: HotTopicQuestionEntity;

  @Column({ name: 'question_id' })
  @RelationId((answer: HotTopicAnswerEntity) => answer.question)
  questionId: number;

  @ManyToOne(() => UserEntity, () => undefined, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'user_id' })
  @RelationId((answer: HotTopicAnswerEntity) => answer.user)
  userId: number;

  @ManyToOne(() => HotTopicAnswerEntity, (category) => category.childs)
  @JoinColumn({ name: 'parent_id' })
  parent?: HotTopicAnswerEntity;

  @Column({ name: 'parent_id', nullable: true })
  @RelationId((answer: HotTopicAnswerEntity) => answer.parent)
  parentId?: number;

  @OneToMany(() => HotTopicAnswerEntity, (category) => category.parent)
  childs: HotTopicAnswerEntity[];

  @OneToMany(() => HotTopicAnswerLikeEntity, (e) => e.answer)
  likes: HotTopicAnswerLikeEntity[];

  @CreateDateColumn()
  createdAt: Date;
}
