import { ApiProperty } from '@nestjs/swagger';
import { BlurtingAnswerDto } from 'src/blurting/dtos/blurtingPageResponse.dto';

export class AnswerWithQuestionDto extends BlurtingAnswerDto {
  @ApiProperty({ description: '질문' })
  question: string;
}
