import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber } from 'class-validator';

export class SignupPhoneRequestDto {
  @ApiProperty({ example: '01012345678' })
  @IsPhoneNumber('KR', { message: '올바른 전화번호가 아닙니다.' })
  phoneNumber: string;
}
