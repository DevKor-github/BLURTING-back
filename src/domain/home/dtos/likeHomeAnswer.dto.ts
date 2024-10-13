import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class likeHomeAnswerDto {
  @IsNumber()
  @ApiProperty({ description: 'answer id' })
  answerId: number;
}
