import { ApiProperty } from '@nestjs/swagger';
import { BlurtingAnswerDto } from 'src/blurting/dtos';
import { BlurtingAnswerEntity } from 'src/entities';

export class AnswerWithQuestionDto extends BlurtingAnswerDto {
  @ApiProperty({ description: '질문' })
  question: string;

  static override ToDto(
    answerEntity: BlurtingAnswerEntity,
    room: string,
    iLike: boolean,
  ) {
    return {
      question: answerEntity.question.question,
      ...BlurtingAnswerDto.ToDto(answerEntity, room, iLike),
    };
  }
}
