import { PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsString, IsEnum } from 'class-validator';
import { Chatting, SocketUser } from 'src/chat/models';
import { Sex } from 'src/common/enums';

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

export class RoomInfoDto {
  @IsString()
  readonly roomId: string;

  @IsDate()
  readonly hasRead: Date;

  @IsString()
  readonly nickname: string;

  @IsEnum(Sex)
  readonly sex: Sex;

  @IsString()
  readonly latest_chat: string;

  @IsDate()
  readonly latest_time: Date;

  static ToDto(
    roomId: string,
    hasRead: Date,
    otherUserSchema: SocketUser,
    chattingSchema: Chatting,
  ): RoomInfoDto {
    return {
      roomId: roomId,
      hasRead: hasRead,
      nickname: otherUserSchema.userNickname,
      sex: otherUserSchema.userSex,
      latest_chat: chattingSchema ? chattingSchema.chat : null,
      latest_time: chattingSchema ? chattingSchema.createdAt : null,
    };
  }
}
