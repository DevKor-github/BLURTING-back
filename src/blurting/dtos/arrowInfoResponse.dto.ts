import { ApiProperty } from '@nestjs/swagger';
import { Sex } from 'src/common/enums';

export class ArrowInfoResponseDto {
  @ApiProperty({ description: '보낸 화살표 정보' })
  iSended: ArrowInfo[];
  @ApiProperty({ description: '받은 화살표 정보' })
  iReceived: ArrowInfo[];
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
