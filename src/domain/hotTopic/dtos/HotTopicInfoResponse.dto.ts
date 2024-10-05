import { ApiProperty } from '@nestjs/swagger';
import type { HotTopicAnswerEntity } from '../entities/hotTopicAnswer.entity';
import type { HotTopicQuestionEntity } from '../entities/hotTopicQuestion.entity';
import { HotTopicSumResponseDto } from './HotTopicSumResponse.dto';
import { Sex } from 'src/common/enums';
class __AnswerDto {
  constructor(entity: HotTopicAnswerEntity, userId: number) {
    this.likeCount = entity.likes.length;
    this.liked = entity.likes.some((like) => like.userId === userId);
    this.createdAt = entity.createdAt.getTime();
    this.username = entity.user.userNickname;
    this.userId = entity.user.id;
    this.gender = entity.user.userInfo.sex;
    this.id = entity.id;
    this.content = entity.answer;
  }
  @ApiProperty({ description: '답변 id' })
  id: number;
  @ApiProperty({ description: '좋아요 수' })
  likeCount: number;
  @ApiProperty({ description: '좋아요 여부' })
  liked: boolean;
  @ApiProperty({ description: '작성된 시각 UNIX TIME' })
  createdAt: number;
  @ApiProperty({ description: '작성자 닉네임' })
  username: string;
  @ApiProperty({ description: '답글 내용' })
  content: string;
  @ApiProperty({ description: '작성자 id' })
  userId: number;
  @ApiProperty({ description: '성별 F or M' })
  gender: Sex;
}
class AnswerDto {
  constructor(entity: HotTopicAnswerEntity, userId: number) {
    this.likeCount = entity.likes.length;
    this.liked = entity.likes.some((like) => like.userId === userId);
    this.createdAt = entity.createdAt.getTime();
    this.username = entity.user.userNickname;
    this.userId = entity.user.id;
    this.id = entity.id;
    this.content = entity.answer;
    this.gender = entity.user.userInfo.sex;
    if (entity.childs)
      this.replies = entity.childs
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((child) => new AnswerDto(child, userId));
  }
  @ApiProperty({ description: '답변 id' })
  id: number;
  @ApiProperty({ description: '좋아요 수' })
  likeCount: number;
  @ApiProperty({ description: '좋아요 여부' })
  liked: boolean;
  @ApiProperty({ description: '작성된 시각 UNIX TIME' })
  createdAt: number;
  @ApiProperty({ description: '작성자 닉네임' })
  username: string;
  @ApiProperty({ description: '작성자 id' })
  userId: number;
  @ApiProperty({ description: '댓글 내용' })
  content: string;
  @ApiProperty({ description: '답글 목록', type: [__AnswerDto] })
  replies: AnswerDto[];
  @ApiProperty({ description: '성별 F or M' })
  gender: Sex;
}

export class HotTopicInfoResponseDto extends HotTopicSumResponseDto {
  constructor(
    entity: HotTopicQuestionEntity,
    likeCount: number,
    replyCount: number,
    participantCount: number,
    bestAnswerEntity: HotTopicAnswerEntity,
    liked: boolean,
    answerEntities: HotTopicAnswerEntity[],
    userId: number,
  ) {
    super(
      entity,
      likeCount,
      replyCount,
      participantCount,
      bestAnswerEntity,
      liked,
    );
    if (bestAnswerEntity) this.bestAnswerId = bestAnswerEntity?.id;
    this.answers = answerEntities
      .filter(
        (e) =>
          !answerEntities.find((answer) =>
            answer.childs.find((child) => child.id === e.id),
          ),
      )
      .map((e) => new AnswerDto(e, userId));
  }
  @ApiProperty({ description: '베스트 댓글 id' })
  bestAnswerId: number;
  @ApiProperty({ description: '답변 목록', type: [AnswerDto] })
  answers: AnswerDto[];
}
