import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BlurtingGroup } from '../entities';

@Entity()
export class BlurtingQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => BlurtingGroup)
  group: BlurtingGroup;

  @Column()
  no: number;

  @Column()
  question: string;
}
