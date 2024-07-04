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
import { SocketUser, Room } from 'src/chat/models';
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
      connected: othereSocketUser.isDeleted
        ? false
        : roomInfo.connected ?? true,
      connectedAt: roomInfo.connectedAt ?? null,
      blurChange: blurChange ?? null,
      chats: chattings,
    };
  }
}
