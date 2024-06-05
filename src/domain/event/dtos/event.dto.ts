import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class EventRegisterDto {
  @IsNotEmpty()
  @ApiProperty({ description: '테이블 번호' })
  table: string;
}
