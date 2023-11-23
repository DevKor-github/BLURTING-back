import { UserEntity } from 'src/entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class PointHistoryEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  type: boolean;

  @Column()
  history: string;

  @CreateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  user: UserEntity;
}
