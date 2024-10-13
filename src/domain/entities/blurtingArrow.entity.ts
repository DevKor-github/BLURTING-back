import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './users.entity';
import { BlurtingGroupEntity } from './blurtingGroup.entity';

@Entity()
export class BlurtingArrowEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'fromId' })
  from: UserEntity;

  @ManyToOne(() => UserEntity, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'toId' })
  to: UserEntity;

  @ManyToOne(() => BlurtingGroupEntity)
  group: BlurtingGroupEntity;

  @Column({ default: 1 })
  no: number;
}
