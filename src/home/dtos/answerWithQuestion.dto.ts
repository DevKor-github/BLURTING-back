import { ApiProperty } from '@nestjs/swagger';
import { BlurtingAnswerDto } from 'src/blurting/dtos/pageResponse.dto';

export class AnswerWithQuestionDto extends BlurtingAnswerDto {
  @ApiProperty({ description: '질문' })
  question: string;
}
