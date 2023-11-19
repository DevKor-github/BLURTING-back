import { PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsString,
  IsEnum,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Chatting, SocketUser } from 'src/chat/models';
import { Sex } from 'src/common/enums';

export class ChatDto {
  @IsString()
  @ApiProperty({ description: 'roomId' })
  readonly roomId: string;

  @IsNumber()
  @ApiProperty({ description: 'userId' })
  readonly userId: number;

  @IsString()
  @ApiProperty({ description: 'chat' })
  readonly chat: string;

  @Type(() => Date)
  @IsDate()
  @ApiProperty({ description: 'createdAt' })
  readonly createdAt: Date;
}

export class AddChatDto extends PickType(ChatDto, [
  'roomId',
  'chat',
] as const) {}

export class ChatUserDto {
  @IsNumber()
  @ApiProperty({ description: 'userId' })
  readonly userId: number;

  @IsDate()
  @ApiProperty({ description: 'hasRead' })
  readonly hasRead: Date;

  @IsBoolean()
  @ApiProperty({ description: 'isDeleted' })
  readonly isDeleted: boolean;
}

export class RoomInfoDto {
  @IsString()
  @ApiProperty({ description: 'roomId' })
  readonly roomId: string;

  @IsDate()
  @ApiProperty({ description: 'hasRead' })
  readonly hasRead: Date;

  @IsString()
  @ApiProperty({ description: 'nickname' })
  readonly nickname: string;

  @IsEnum(Sex)
  readonly sex: Sex;

  @IsString()
  @ApiProperty({ description: 'latest_chat' })
  readonly latest_chat: string;

  @IsDate()
  @ApiProperty({ description: 'latest_time' })
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
      nickname: otherUserSchema
        ? otherUserSchema.userNickname
        : '탈퇴한 사용자',
      sex: otherUserSchema ? otherUserSchema.userSex : null,
      latest_chat: chattingSchema ? chattingSchema.chat : null,
      latest_time: chattingSchema ? chattingSchema.createdAt : null,
    };
  }
}

export class RoomChatDto {
  @IsNumber()
  @ApiProperty({ description: 'otherId' })
  otherId: number;

  @IsString()
  @ApiProperty({ description: 'otherImage' })
  otherImage: string;

  @IsDate()
  @ApiProperty({ description: 'hasRead' })
  hasRead: Date;

  @IsNumber()
  @ApiProperty({ description: 'blur단계' })
  blur: number;

  @IsArray()
  @ApiProperty({
    description: 'chats',
    type: ChatDto,
    isArray: true,
  })
  chats: ChatDto[];

  static ToDto(
    otherUser: ChatUserDto,
    otherImage: SocketUser,
    blur: number,
    chattings: ChatDto[],
  ): RoomChatDto {
    const image = otherImage ? otherImage.userImage : null;
    return {
      otherId: otherUser.userId,
      otherImage: image ?? null,
      hasRead: otherUser.hasRead,
      blur: blur ?? 1,
      chats: chattings,
    };
  }
}

export class InRoomDto {
  @IsString()
  roomId: string;

  @IsBoolean()
  inRoom: boolean;
}
