import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BlurtingQuestionEntity, UserEntity } from '../entities';
import { Sex } from 'src/common/enums';

@Entity()
export class BlurtingAnswerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => BlurtingQuestionEntity)
  question: BlurtingQuestionEntity;

  @ManyToOne(() => UserEntity, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  user: UserEntity;

  @Column()
  answer: string;

  @Column({ nullable: true })
  userSex: Sex;

  @Column()
  postedAt: Date;

  @Column({ default: 0 })
  allLikes: number;
}
