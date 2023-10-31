import { PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';

export class AddChatDto {
  @IsString()
  readonly roomId: string;

  @IsNumber()
  readonly userId: number;

  @IsString()
  readonly chat: string;

  @Type(() => Date)
  @IsDate()
  readonly createdAt: Date;
}

export class ChatDto extends PickType(AddChatDto, [
  'roomId',
  'chat',
  'createdAt',
] as const) {}

export class ChatUserDto {
  @IsNumber()
  readonly userId: number;

  @IsString()
  readonly userImage: string;

  @IsDate()
  readonly hasRead: Date;

  @IsBoolean()
  readonly isDeleted: boolean;
}
