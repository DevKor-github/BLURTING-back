import { UserEntity } from 'src/entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class AuthMailEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  isValid: boolean;

  @Column()
  code: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => UserEntity, () => undefined)
  user: UserEntity;
}
