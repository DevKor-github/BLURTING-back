import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class HotTopicAnswerRequestDto {
  @IsNumber()
  @ApiProperty({ description: '핫토픽 질문 id' })
  topicId: number;
  @IsString()
  @ApiProperty({ description: '답변 내용' })
  content: string;
  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: '답글이라면 답글 부모 댓글의 id' })
  parentId?: number;
}
