import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from 'src/entities';
import {
  Sex,
  SexOrient,
  Mbti,
  Degree,
  Major,
  Religion,
  Job,
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

  @Column({
    nullable: true,
    type: 'enum',
    enum: Religion,
  })
  religion?: Religion;

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

  @Column({ nullable: true, type: 'enum', enum: Job })
  job?: Job;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn()
  user: UserEntity;
}
