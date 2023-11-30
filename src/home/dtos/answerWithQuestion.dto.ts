import { ApiProperty } from '@nestjs/swagger';
import { BlurtingAnswerDto } from 'src/dtos/blurtingPage.dto';

export class AnswerWithQuestionDto extends BlurtingAnswerDto {
  @ApiProperty({ description: '질문' })
  question: string;
}
