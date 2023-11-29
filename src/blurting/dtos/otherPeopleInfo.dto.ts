import { ApiProperty } from '@nestjs/swagger';
import { Sex } from 'src/common/enums';

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
