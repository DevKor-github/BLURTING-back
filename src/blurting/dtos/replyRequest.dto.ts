import { ApiProperty } from '@nestjs/swagger';

export class ReplyRequestDto {
  @ApiProperty({ description: '답글 내용' })
  content: string;
}
