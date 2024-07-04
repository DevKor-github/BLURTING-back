import { IsBoolean, IsDate, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Chatting, SocketUser } from 'src/chat/models';
import { Sex } from 'src/common/enums';

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

export class InRoomDto {
  @IsString()
  roomId: string;

  @IsBoolean()
  inRoom: boolean;
}
