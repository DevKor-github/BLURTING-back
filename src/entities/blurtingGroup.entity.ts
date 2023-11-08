import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class BlurtingGroupEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  createdAt: Date;
}
