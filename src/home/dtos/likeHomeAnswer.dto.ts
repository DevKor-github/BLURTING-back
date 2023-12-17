import { ApiProperty } from '@nestjs/swagger';

export class likeHomeAnswerDto {
  @ApiProperty({ description: 'answer id' }) answerId: number;
}
