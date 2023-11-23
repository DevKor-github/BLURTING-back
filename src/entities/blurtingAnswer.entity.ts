import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BlurtingQuestionEntity, UserEntity } from '../entities';
import { Sex } from 'src/common/enums';

@Entity()
export class BlurtingAnswerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => BlurtingQuestionEntity)
  question: BlurtingQuestionEntity;

  @ManyToOne(() => UserEntity)
  user: UserEntity;

  @Column({
    nullable: true,
    type: 'enum',
    enum: Sex,
  })
  sex?: Sex;

  @Column()
  answer: string;

  @Column()
  postedAt: Date;
}
