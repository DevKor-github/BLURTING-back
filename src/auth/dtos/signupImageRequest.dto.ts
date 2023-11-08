import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class SignupImageRequestDto {
  @ApiProperty({ example: ['s3.asfsva', 'asdfasdf'] })
  @IsArray({ message: 'not valid' })
  images: string[];
}
