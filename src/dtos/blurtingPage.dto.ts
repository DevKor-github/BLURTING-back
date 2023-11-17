import { IsNumber, IsDate, IsString, IsArray } from 'class-validator';
import {
  BlurtingAnswerEntity,
  BlurtingGroupEntity,
  BlurtingQuestionEntity,
} from 'src/entities';

export class BlurtingAnswerDto {
  @IsNumber()
  userId: number;

  @IsString()
  userNickname: string;

  @IsString()
  answer: string;

  @IsDate()
  postedAt: Date;

  static ToDto(answerEntity: BlurtingAnswerEntity): BlurtingAnswerDto {
    return {
      userId: answerEntity.user.id,
      userNickname: answerEntity.user.userNickname,
      answer: answerEntity.answer,
      postedAt: answerEntity.postedAt,
    };
  }
}

export class BlurtingPageDto {
  @IsNumber()
  groupId: number;

  @IsDate()
  createdAt: Date;

  @IsNumber()
  questionId: number;

  @IsNumber()
  questionNo: number;

  @IsString()
  question: string;

  @IsArray()
  answers: BlurtingAnswerDto[];

  static ToDto(
    groupEntity: BlurtingGroupEntity,
    questionEntity: BlurtingQuestionEntity,
    answerEntities: BlurtingAnswerEntity[],
  ): BlurtingPageDto {
    const answersDto = answerEntities.map((answerEntity) =>
      BlurtingAnswerDto.ToDto(answerEntity),
    );
    return {
      groupId: groupEntity.id,
      createdAt: groupEntity.createdAt,
      questionId: questionEntity.id,
      questionNo: questionEntity.no,
      question: questionEntity.question,
      answers: answersDto,
    };
  }
}

export class AnswerDto {
  @IsNumber()
  questionId: number;

  @IsString()
  answer: string;
}
