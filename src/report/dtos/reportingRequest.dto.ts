import { ApiProperty } from '@nestjs/swagger';

export class ReportingRequestDto {
  @ApiProperty({ description: '신고 사유' })
  reason: string;
}
