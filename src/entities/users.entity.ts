import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UserInfoEntity } from './userInfo.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, length: 20 })
  userName?: string;

  @Column({ length: 50 })
  userNickname: string;

  @Column({ nullable: true, length: 100 })
  email?: string;

  @Column({ nullable: true, length: 11 })
  phoneNumber?: string;

  @Column({ nullable: true })
  token?: string;

  @OneToOne(() => UserInfoEntity)
  @JoinColumn()
  userInfo: UserInfoEntity;
}
