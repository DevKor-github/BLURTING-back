import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ReplyRequestDto {
  @ApiProperty({ description: '답글 내용' })
  @IsString({ message: '문자열을 입력해주세요' })
  content: string;
}
