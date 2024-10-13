import { PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsString,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SocketUser, Room } from 'src/domain/chat/models';
import { ChatUserDto } from './user.dto';

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
  @ApiProperty({ description: '삭제 신고로 인해 연결이 끊겼는가' })
  connected: boolean;

  @IsBoolean()
  @ApiProperty({ description: '무료 채팅 종료' })
  freeExpired: boolean;

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
      connected: othereSocketUser.isDeleted
        ? false
        : roomInfo.connected ?? true,
      freeExpired: roomInfo.freeExpired ?? false,
      blurChange: blurChange ?? null,
      chats: chattings,
    };
  }
}
