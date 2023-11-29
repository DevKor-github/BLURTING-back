import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BlurtingQuestionEntity, UserEntity } from '../entities';

@Entity()
export class BlurtingAnswerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => BlurtingQuestionEntity)
  question: BlurtingQuestionEntity;

  @ManyToOne(() => UserEntity)
  user: UserEntity;

  @Column()
  answer: string;

  @Column()
  postedAt: Date;

  @Column({ default: 0 })
  groupLikes: number;

  @Column({ default: 0 })
  allLikes: number;
}
