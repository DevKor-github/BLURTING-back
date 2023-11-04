import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BlurtingQuestion, UserEntity } from '../entities';

@Entity()
export class BlurtingAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => BlurtingQuestion)
  question: BlurtingQuestion;

  @ManyToOne(() => UserEntity)
  user: UserEntity;

  @Column()
  answer: string;

  @Column()
  postedAt: Date;
}
