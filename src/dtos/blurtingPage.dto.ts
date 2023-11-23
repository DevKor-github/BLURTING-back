import { IsNumber, IsDate, IsString, IsArray } from 'class-validator';
import {
  BlurtingAnswerEntity,
  BlurtingGroupEntity,
  BlurtingQuestionEntity,
} from 'src/entities';
import { ApiProperty } from '@nestjs/swagger';

export class BlurtingAnswerDto {
  @IsNumber()
  @ApiProperty({ description: 'userId' })
  userId: number;

  @IsString()
  @ApiProperty({ description: 'userNickname' })
  userNickname: string;

  @IsString()
  @ApiProperty({ description: 'answer' })
  answer: string;

  @IsDate()
  @ApiProperty({ description: 'postedAt' })
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
  @ApiProperty({ description: 'groupId' })
  groupId: number;

  @IsDate()
  @ApiProperty({ description: 'group 생성 시간' })
  createdAt: Date;

  @IsNumber()
  @ApiProperty({ description: 'question 고유 아이디' })
  questionId: number;

  @IsNumber()
  @ApiProperty({ description: 'question 번호' })
  questionNo: number;

  @IsString()
  @ApiProperty({ description: 'question' })
  question: string;

  @IsArray()
  @ApiProperty({
    description: 'question에 따른 답변들',
    type: Array<BlurtingAnswerDto>,
  })
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
  @ApiProperty({ description: 'question 고유 아이디' })
  questionId: number;

  @IsString()
  @ApiProperty({ description: 'answer' })
  answer: string;
}
