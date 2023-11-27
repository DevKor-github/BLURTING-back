import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BlurtingAnswerEntity, UserEntity } from '../entities';

@Entity()
export class LikeEntity {
  @PrimaryColumn()
  answerId: number;

  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => BlurtingAnswerEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'answerId' })
  answer: BlurtingAnswerEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
