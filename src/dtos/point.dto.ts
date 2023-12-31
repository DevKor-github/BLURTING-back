import { Type } from 'class-transformer';
import { IsDate, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PointHistoryEntity } from 'src/entities';

export class PointHistoryDto {
  @IsString()
  @ApiProperty({ description: 'history' })
  readonly history: string;

  @Type(() => Date)
  @IsDate()
  @ApiProperty({ description: 'date' })
  readonly date: Date;

  static ToDto(pointHistory: PointHistoryEntity): PointHistoryDto {
    return {
      history: pointHistory.history,
      date: pointHistory.updatedAt,
    };
  }
}
