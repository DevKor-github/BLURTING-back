import { IsBoolean, IsDate, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatUserDto {
  @IsNumber()
  @ApiProperty({ description: 'userId' })
  readonly userId: number;

  @IsDate()
  @ApiProperty({ description: 'hasRead' })
  readonly hasRead: Date;

  @IsBoolean()
  @ApiProperty({ description: 'isDeleted' })
  readonly isDeleted: boolean;

  @IsNumber()
  @ApiProperty({ description: 'blur step' })
  blur: number;
}
