import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './users.entity';

@Entity()
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => UserEntity, () => undefined, { onDelete: 'CASCADE' })
  user: UserEntity;

  @Column()
  body: string;
}
