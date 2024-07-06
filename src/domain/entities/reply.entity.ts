import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BlurtingAnswerEntity, UserEntity } from '../entities';

@Entity()
export class ReplyEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => BlurtingAnswerEntity)
  answer: BlurtingAnswerEntity;

  @ManyToOne(() => UserEntity, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  user: UserEntity;

  @Column()
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
