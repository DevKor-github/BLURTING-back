import { ApiProperty } from '@nestjs/swagger';
import { BlurtingAnswerDto } from 'src/dtos/blurtingPage.dto';

export class HomeInfoResponseDto {
  @ApiProperty({ description: 'MVP 질문들', type: [BlurtingAnswerDto] })
  answers: BlurtingAnswerDto[];

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
