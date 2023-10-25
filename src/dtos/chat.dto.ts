import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';

export class ChatDto {
  @IsString()
  readonly roomId: string;

  @IsNumber()
  readonly userId: number;

  @IsString()
  readonly chat: string;

  @Type(() => Date)
  @IsDate()
  readonly createdAt: Date;
}

export class ChatUserDto {
  @IsNumber()
  readonly userId: number;

  @IsString()
  readonly userImage: string;

  @IsDate()
  readonly hasRead: Date;

  @IsBoolean()
  readonly isDeleted: Date;
}
