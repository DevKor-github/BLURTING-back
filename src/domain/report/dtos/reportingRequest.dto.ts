import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class ReportingRequestDto {
  @ApiProperty({ description: '신고할 유저의 id' })
  @IsNumber()
  reportingId: number;

  @ApiProperty({ description: '신고 사유' })
  reason: string;
}
