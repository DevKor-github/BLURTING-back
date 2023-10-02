import {IsNotEmpty, IsEnum, IsString } from 'class-validator';
import { Sex } from 'src/common/enums/sex.enum';
import { SexOrient } from 'src/common/enums/sexOrient.enum';
import { Religion } from 'src/common/enums/religion.enum';
import { Mbti } from 'src/common/enums/mbti.enum';
import { Habit } from 'src/common/enums/habit.enum';

export class CreateUserInfoDto{
  @IsNotEmpty()
  @IsEnum(Sex)
  sex: Sex;

  @IsNotEmpty()
  @IsEnum(SexOrient)
  sexOrient: SexOrient;

  @IsNotEmpty()
  @IsString()
  region: string;

  @IsNotEmpty()
  @IsEnum(Religion)
  religion: Religion;

  @IsNotEmpty()
  @IsEnum(Habit)
  drink: Habit;

  @IsNotEmpty()
  @IsEnum(Habit)
  cigarette: Habit;

  @IsNotEmpty()
  height: number;

  @IsNotEmpty()
  major: string;

  @IsNotEmpty()
  @IsEnum(Mbti)
  mbti: Mbti;

  @IsNotEmpty()
  character: string;

  @IsNotEmpty()
  hobby: string;

  @IsNotEmpty()
  university: string;
}