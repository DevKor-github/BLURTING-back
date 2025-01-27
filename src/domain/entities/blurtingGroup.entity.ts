import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BlurtingQuestionEntity } from './blurtingQuestion.entity';

@Entity()
export class BlurtingGroupEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  createdAt: Date;

  @OneToMany(() => BlurtingQuestionEntity, (question) => question.group)
  questions: BlurtingQuestionEntity[];
}
