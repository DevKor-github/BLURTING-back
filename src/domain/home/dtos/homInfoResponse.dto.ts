import { ApiProperty } from '@nestjs/swagger';
import { AnswerWithQuestionDto } from './answerWithQuestion.dto';
import { UserEntity } from 'src/domain/entities';

export class RandomUserDto {
  @ApiProperty({ description: '유저 아이디' })
  id: number;

  @ApiProperty({ description: '유저 닉네임' })
  userNickname: string;

  @ApiProperty({ description: '유저 사진' })
  image: string;

  @ApiProperty({ description: '유저 지역' })
  region: string;

  @ApiProperty({ description: '유저 mbti' })
  mbti: string;

  constructor(user: UserEntity, images: string[]) {
    this.id = user.id;
    this.userNickname = user.userNickname;
    this.image = images.length > 0 ? images[0] : null;
    this.region = user.userInfo?.region ?? '';
    this.mbti = user.userInfo?.mbti ?? '';
  }
}

export class HomeInfoResponseDto {
  @ApiProperty({ description: 'MVP 질문들', type: [AnswerWithQuestionDto] })
  answers: AnswerWithQuestionDto[];

  @ApiProperty({ description: '질문 남은 시간 단위 : ms, 그룹에 없으면 -1 줌' })
  seconds: number;

  @ApiProperty({ description: '화살 수' })
  arrows: number;

  @ApiProperty({ description: '매치된 화살 수' })
  matchedArrows: number;

  @ApiProperty({ description: '채팅 수' })
  chats: number;

  @ApiProperty({ description: '내 답변 좋아요 수' })
  likes: number;
}
