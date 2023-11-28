import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './users.entity';

@Entity()
export class ReportEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity)
  reporterUser: UserEntity;

  @ManyToOne(() => UserEntity)
  reportedUser: UserEntity;

  @Column()
  reason: string;
}
