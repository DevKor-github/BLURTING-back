import { Type } from 'class-transformer';
import { IsDate, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PointHistoryEntity } from 'src/domain/entities';

export class PointHistoryDto {
  @IsString()
  @ApiProperty({ description: 'history' })
  readonly history: string;

  @Type(() => Date)
  @IsDate()
  @ApiProperty({ description: 'date' })
  readonly date: Date;

  constructor(pointHistory: PointHistoryEntity) {
    return {
      history: pointHistory.history,
      date: pointHistory.updatedAt,
    };
  }
}
