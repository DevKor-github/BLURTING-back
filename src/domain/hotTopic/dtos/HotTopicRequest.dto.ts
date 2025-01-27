import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class HotTopicRequestDto {
  @IsString()
  @ApiProperty({ description: '질문' })
  question: string;
  @IsString()
  @ApiProperty({ description: '질문 작성자' })
  createdBy: string;
}
