import { ApiProperty } from '@nestjs/swagger';
import { Sex } from 'src/common/enums';
import { UserProfileDto } from 'src/domain/dtos/user.dto';

export class ArrowResultResponseDto {
  @ApiProperty({ description: '매칭 성공 여부' })
  matching: boolean;
  @ApiProperty({ description: '매칭된 사람 정보' })
  matchedWith: UserProfileDto;
  @ApiProperty({ description: '받은 화살표 정보' })
  iReceived: ArrowInfo[];
}

export class ArrowInfo {
  @ApiProperty({ description: '보낸 userId' })
  fromId: number;
  @ApiProperty({ description: '유저 닉네임' })
  nickname: string;
  @ApiProperty({ description: '유저 성별' })
  sex: Sex;
}

export class ArrowDto {
  fromId: number;
  toId: number;
  groupId: number;
  no: number;
}
