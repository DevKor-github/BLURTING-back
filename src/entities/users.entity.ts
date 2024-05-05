import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BlurtingGroupEntity, UserInfoEntity } from 'src/entities';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  userNickname: string;

  @Column({ nullable: true })
  birth?: Date;

  @Column({ nullable: true, length: 11 })
  phoneNumber?: string;

  @Column({ nullable: true })
  token?: string;

  @Column({ nullable: true })
  point: number;

  @OneToOne(() => UserInfoEntity)
  @JoinColumn()
  userInfo: UserInfoEntity;

  @ManyToOne(() => BlurtingGroupEntity, {
    nullable: true,
  })
  @JoinColumn()
  group?: BlurtingGroupEntity;
}
