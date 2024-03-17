import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { BlurtingGroupEntity } from './blurtingGroup.entity';

@Entity()
export class BlurtingEventEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  table: string;

  @ManyToOne(() => BlurtingGroupEntity)
  @JoinColumn()
  group: BlurtingGroupEntity;
}
