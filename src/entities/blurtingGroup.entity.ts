import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class BlurtingGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  createdAt: Date;
}
