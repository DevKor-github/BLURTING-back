import { UserEntity } from 'src/entities/user.entity';
import { Sex } from 'src/common/enums/sex.enum';
import { SexOrient } from 'src/common/enums/sexOrient.enum';
import { Religion } from 'src/common/enums/religion.enum';
import { Mbti } from 'src/common/enums/mbti.enum';
import { Habit } from 'src/common/enums/habit.enum';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';

@Entity('userInfo')
export class UserInfoEntity {
  @PrimaryGeneratedColumn()
  InfoId: number;

  @Column({
    type: 'enum',
    enum: Sex,
  })
  sex: Sex;

  @Column({
    type: 'enum',
    enum: SexOrient,
  })
  sexOrient: SexOrient;

  @Column()
  region: string;

  @Column({
    type: 'enum',
    enum: Religion,
  })
  religion: Religion;

  @Column({
    type: 'enum',
    enum: Habit,
  })
  drink: Habit;

  @Column({
    type: 'enum',
    enum: Habit,
  })
  cigarette: Habit;

  @Column()
  height: number;

  @Column()
  major: string;

  @Column({
    type: 'enum',
    enum: Mbti,
  })
  mbti: Mbti;

  @Column()
  character: string;

  @Column()
  hobby: string;

  @Column()
  university: string;


  @OneToOne(() => UserEntity)
  @JoinColumn()
  user: UserEntity;
}