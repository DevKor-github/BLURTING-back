import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty({
    description: 'new access token',
    example: 'asda.123asc.asd123',
  })
  accessToken: string;
}

export class SignupTokenResponseDto {
  @ApiProperty({
    description: 'new singup token',
    example: 'asda.123asc.asd123',
  })
  signupToken: string;
}
