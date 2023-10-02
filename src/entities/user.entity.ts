import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, BeforeInsert } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  Id: number;

  @PrimaryColumn()
  userId: string;

  @Column()
  userHash: string;

  @Column({ nullable: true, length: 20, })
  userName: string;

  @Column({ length: 50, })
  userNickname: string;

  @Column({ length: 100, })
  email: string;

  @Column({ length: 11, })
  phoneNumber: string;

  @Column({ nullable: true, })
  token: string;
}

