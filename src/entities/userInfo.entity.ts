import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from 'src/entities/users.entity';
import { Sex } from 'src/common/enums/sex.enum';
import { SexOrient } from 'src/common/enums/sexOrient.enum';
import { Mbti } from 'src/common/enums/mbti.enum';
import { Degree } from 'src/common/enums/degree.enum';
import { Major } from 'src/common/enums/major.enum';
import { University } from 'src/common/enums/university.enum';

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
