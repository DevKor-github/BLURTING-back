import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class SignupEmailRequestDto {
  @IsEmail()
  @ApiProperty({ example: 'devkor.apply@korea.ac.kr' })
  email: string;
}
