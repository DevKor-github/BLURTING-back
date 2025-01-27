import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Sex } from 'src/common/enums';
import { UserProfileDto } from 'src/domain/dtos/user.dto';

export class OtherPeopleInfoDto {
  @ApiProperty({ description: 'userId' })
  userId: number;

  @ApiProperty({ description: 'userNickname' })
  userNickname: string;

  @ApiProperty({ description: 'userSex' })
  userSex: Sex;

  @ApiProperty({ description: 'reported', example: false })
  reported: boolean;
}

export class BlurtingProfileDto extends PickType(UserProfileDto, [
  'sex',
  'nickname',
  'mbti',
] as const) {
  @IsOptional()
  @IsString()
  room: string;

  static ToDto(userInfo: UserProfileDto, room: string): BlurtingProfileDto {
    return {
      sex: userInfo.sex,
      nickname: userInfo.nickname,
      mbti: userInfo.mbti,
      room: room,
    };
  }
}
