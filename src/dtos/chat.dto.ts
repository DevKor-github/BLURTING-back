import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsString } from 'class-validator';
import { PickType } from '@nestjs/swagger';

export class ChatDto {
  @IsString()
  readonly roomId: string;

  @IsNumber()
  readonly userId: number;

  @IsString()
  readonly userNickname: string;

  @IsString()
  readonly chat: string;

  @Type(() => Date)
  @IsDate()
  readonly createdAt: Date;
}

export class ChatUserDto extends PickType(ChatDto, [
  'userId',
  'userNickname',
] as const) {}
