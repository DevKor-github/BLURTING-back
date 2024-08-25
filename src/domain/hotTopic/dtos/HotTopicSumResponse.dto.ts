import { ApiProperty } from '@nestjs/swagger';
import type { HotTopicAnswerEntity } from '../entities/hotTopicAnswer.entity';
import type { HotTopicQuestionEntity } from '../entities/hotTopicQuestion.entity';

export class HotTopicSumResponseDto {
  constructor(
    entity: HotTopicQuestionEntity,
    likeCount: number,
    replyCount: number,
    participantCount: number,
    bestAnswerEntity: HotTopicAnswerEntity,
    liked: boolean,
  ) {
    this.id = entity.id;
    this.participantCount = participantCount;
    this.likeCount = likeCount;
    this.replyCount = replyCount;
    this.liked = liked;
    this.question = entity.question;
    this.createdAt = entity.createdAt.getTime();
    this.createdBy = entity.createdBy;
    if (bestAnswerEntity) {
      this.bestUserName = bestAnswerEntity.user.userNickname;
      this.bestAnswer = bestAnswerEntity.answer;
    }
  }
  @ApiProperty({ description: '질문 id' })
  id: number;
  @ApiProperty({ description: '참여자 수' })
  participantCount: number;
  @ApiProperty({ description: '좋아요 수' })
  likeCount: number;
  @ApiProperty({ description: '답변 수' })
  replyCount: number;
  @ApiProperty({ description: '좋아요 여부' })
  liked: boolean;
  @ApiProperty({ description: '질문' })
  question: string;
  @ApiProperty({ description: '작성된 시각 UNIX TIME' })
  createdAt: number;
  @ApiProperty({ description: '작성자' })
  createdBy: string;

  @ApiProperty({ description: '베스트 댓글 유저네임' })
  bestUserName: string;
  @ApiProperty({ description: '베스트 댓글' })
  bestAnswer: string;
}
