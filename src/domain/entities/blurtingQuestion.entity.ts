import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BlurtingAnswerEntity, BlurtingGroupEntity } from '../entities';

@Entity()
export class BlurtingQuestionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => BlurtingGroupEntity, (group) => group.questions)
  group: BlurtingGroupEntity;

  @Column()
  no: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  question: string;

  @OneToMany(() => BlurtingAnswerEntity, (answer) => answer.question)
  answers: BlurtingAnswerEntity[];
}
