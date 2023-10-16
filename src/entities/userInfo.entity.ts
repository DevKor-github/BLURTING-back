import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from 'src/entities/users.entity';
import {
  Sex,
  SexOrient,
  Mbti,
  Degree,
  Major,
  University,
} from 'src/common/enums';

@Entity('userInfo')
export class UserInfoEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    nullable: true,
    type: 'enum',
    enum: Sex,
  })
  sex?: Sex;

  @Column({
    nullable: true,
    type: 'enum',
    enum: SexOrient,
  })
  sexOrient?: SexOrient;

  @Column({ nullable: true })
  region?: string;

  @Column({ nullable: true })
  religion?: string;

  @Column({
    nullable: true,
    type: 'enum',
    enum: Degree,
  })
  drink?: Degree;

  @Column({
    nullable: true,
    type: 'enum',
    enum: Degree,
  })
  cigarette?: Degree;

  @Column({ nullable: true })
  height?: number;

  @Column({ nullable: true, type: 'enum', enum: Major })
  major?: Major;

  @Column({ nullable: true, type: 'enum', enum: Mbti })
  mbti?: Mbti;

  @Column({ nullable: true })
  character?: number;

  @Column({ nullable: true })
  hobby?: number;

  @Column({ nullable: true })
  university?: University;

  @OneToOne(() => UserEntity)
  @JoinColumn()
  user: UserEntity;
}
