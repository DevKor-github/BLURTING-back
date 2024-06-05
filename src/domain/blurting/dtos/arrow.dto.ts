import { ApiProperty } from '@nestjs/swagger';
import { Sex } from 'src/common/enums';

export class ArrowInfoResponseDto {
  @ApiProperty({ description: '보낸 화살표 정보' })
  iSended: ArrowInfo[];
  @ApiProperty({ description: '받은 화살표 정보' })
  iReceived: ArrowInfo[];
}

export class ArrowResultResponseDto {
  @ApiProperty({ description: '본인 닉네임' })
  myname: string;
  @ApiProperty({ description: '본인 성별' })
  mysex: Sex;
  @ApiProperty({ description: '상대 닉네임' })
  othername?: string;
  @ApiProperty({ description: '상대 성별' })
  othersex?: Sex;
}

export class ArrowInfo {
  @ApiProperty({ description: '보낸 userId' })
  fromId: number;
  @ApiProperty({ description: '받은 userId' })
  toId: number;
  @ApiProperty({ description: '몇번째 화살표? 1, 2, 3', example: 1 })
  day: number;

  @ApiProperty({ description: '유저 닉네임' })
  username: string;
  @ApiProperty({ description: '유저 성별' })
  userSex: Sex;
}

export class ArrowDto {
  fromId: number;
  toId: number;
  groupId: number;
  no: number;
}
