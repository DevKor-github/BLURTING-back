import { UserEntity } from 'src/entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class AuthPhoneNumberEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  isValid: boolean;

  @Column()
  code: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  user: UserEntity;
}
