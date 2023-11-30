import { ApiProperty } from '@nestjs/swagger';
import { ValidateIf } from 'class-validator';

export class ReportingRequestDto {
  @ApiProperty({ description: '신고할 유저의 id' })
  @ValidateIf((o) => o.reportingId !== undefined || o.reportingId !== null)
  reportingId: number;

  @ApiProperty({ description: '신고 사유' })
  reason: string;
}
