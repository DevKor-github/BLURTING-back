import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BlurtingGroupEntity } from '../entities';

@Entity()
export class BlurtingPreQuestionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => BlurtingGroupEntity,
    (group) => group.questions,
  )
  group: BlurtingGroupEntity;

  @Column()
  no: number;

  @Column()
  question: string;

  @Column()
  isUploaded: boolean;
}
