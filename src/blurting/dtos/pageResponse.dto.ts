import {
  IsNumber,
  IsDate,
  IsString,
  IsArray,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import {
  BlurtingAnswerEntity,
  BlurtingGroupEntity,
  BlurtingQuestionEntity,
  ReplyEntity,
} from 'src/entities';
import { ApiProperty } from '@nestjs/swagger';
import { Mbti, Sex } from 'src/common/enums';

export class BlurtingReplyDto {
  @ApiProperty({ description: '답글 작성 유저 아이디' })
  writerUserId: number;
  @ApiProperty({ description: '답글 작성 유저 닉네임' })
  writerUserName: string;
  @ApiProperty({ description: '답글 내용' })
  content: string;
  @ApiProperty({ description: '답글 작성 시간 ( 한국 시간 기준 )' })
  createdAt: Date;
  static toDto(entity: ReplyEntity): BlurtingReplyDto {
    return {
      writerUserId: entity.user?.id ?? null,
      writerUserName: entity.user?.userNickname ?? '탈퇴한 사용자',
      content: entity.content,
      createdAt: new Date(entity.createdAt.getTime() + 1000 * 60 * 60 * 9),
    };
  }
}
export class BlurtingAnswerDto {
  @IsNumber()
  @ApiProperty({ description: 'userId' })
  userId: number;

  @IsString()
  @ApiProperty({ description: 'userNickname' })
  userNickname: string;

  @IsEnum(Sex)
  @ApiProperty({ description: 'userSex', enum: Sex, enumName: 'Sex' })
  userSex?: Sex;

  @IsString()
  @ApiProperty({ description: 'answer' })
  answer: string;

  @IsDate()
  @ApiProperty({ description: 'postedAt' })
  postedAt: Date;

  @IsEnum(Mbti)
  @ApiProperty({ description: 'mbti' })
  mbti: Mbti;

  @ValidateIf((o) => o.room !== null)
  @IsString()
  @ApiProperty({ description: '귓속말 연결된 상대는 roomId, 아니면 null' })
  room: string;

  @ApiProperty({ description: '내가 좋아요했는지' })
  ilike: boolean;

  @ApiProperty({ description: '좋아요 수' })
  likes: number;

  @ApiProperty({ description: '답변 ID' })
  id: number;

  @ApiProperty({ description: '답글들', type: BlurtingReplyDto, isArray: true })
  reply: BlurtingReplyDto[];

  static ToDto(
    answerEntity: BlurtingAnswerEntity,
    room: string,
    ilike: boolean = false,
  ): BlurtingAnswerDto {
    return {
      id: answerEntity.id,
      userId: answerEntity.user?.id ?? 0,
      userNickname: answerEntity.user?.userNickname ?? '탈퇴한 사용자',
      userSex: answerEntity.userSex ?? Sex.Female,
      answer: answerEntity.answer,
      postedAt: answerEntity.postedAt,
      mbti: answerEntity.user?.userInfo?.mbti ?? null,
      room,
      likes: answerEntity.allLikes,
      ilike,
      reply: answerEntity.reply
        ? answerEntity.reply.map((e) => BlurtingReplyDto.toDto(e))
        : null,
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
    type: BlurtingAnswerDto,
    isArray: true,
  })
  answers: BlurtingAnswerDto[];

  static ToDto(
    groupEntity: BlurtingGroupEntity,
    questionEntity: BlurtingQuestionEntity,
    answersDto: BlurtingAnswerDto[],
  ): BlurtingPageDto {
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
