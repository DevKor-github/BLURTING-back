import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnswerRequestDto {
  @IsNumber()
  @ApiProperty({ description: 'question 고유 아이디' })
  questionId: number;

  @IsString()
  @ApiProperty({ description: 'answer' })
  answer: string;
}
