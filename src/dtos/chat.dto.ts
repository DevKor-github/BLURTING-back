import { PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsString,
  IsEnum,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Chatting, SocketUser, Room } from 'src/chat/models';
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

  @IsNumber()
  @ApiProperty({ description: 'blur step' })
  blur: number;
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
      nickname: otherUserSchema.isDeleted
        ? '탈퇴한 사용자'
        : otherUserSchema.userNickname,
      sex: otherUserSchema?.userSex ?? null,
      latest_chat: chattingSchema?.chat ?? null,
      latest_time: chattingSchema?.createdAt ?? null,
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

  @IsBoolean()
  @ApiProperty({ description: 'connected' })
  connected: boolean;

  @IsDate()
  @ApiProperty({ description: 'point 써서 귓속말 건 시각' })
  readonly connectedAt: Date;

  @ValidateIf((o) => o.blurChange != null)
  @ApiProperty({ description: 'blur step 별 처음 바뀔 때 blur step' })
  @IsNumber()
  blurChange: number;

  @IsArray()
  @ApiProperty({
    description: 'chats',
    type: ChatDto,
    isArray: true,
  })
  chats: ChatDto[];

  static ToDto(
    otherUser: ChatUserDto,
    othereSocketUser: SocketUser,
    roomInfo: Room,
    blurChange: number,
    chattings: ChatDto[],
  ): RoomChatDto {
    return {
      otherId: othereSocketUser.isDeleted ? 0 : othereSocketUser.userId,
      otherImage: othereSocketUser?.userImage ?? null,
      hasRead: otherUser.hasRead,
      blur: otherUser.blur ?? 1,
      connected: othereSocketUser.isDeleted ? true : roomInfo.connected ?? true,
      connectedAt: roomInfo.connectedAt ?? null,
      blurChange: blurChange ?? null,
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
