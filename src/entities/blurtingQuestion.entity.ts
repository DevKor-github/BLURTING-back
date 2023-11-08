import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BlurtingGroupEntity } from '../entities';

@Entity()
export class BlurtingQuestionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => BlurtingGroupEntity)
  group: BlurtingGroupEntity;

  @Column()
  no: number;

  @Column()
  question: string;
}
