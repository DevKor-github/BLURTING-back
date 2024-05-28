import { IsEnum, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Sex } from 'src/common/enums';

export class AnswerRequestDto {
  @IsNumber()
  @ApiProperty({ description: 'question 고유 아이디' })
  questionId: number;

  @IsString()
  @ApiProperty({ description: 'answer' })
  answer: string;
}

export class AnswerDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  questionId: number;

  @IsString()
  answer: string;

  @IsEnum(Sex)
  userSex: Sex;
}
