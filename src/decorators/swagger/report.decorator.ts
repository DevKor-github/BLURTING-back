import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ReportingRequestDto } from 'src/report/dtos/reportingRequest.dto';

export function ReportDocs() {
  return applyDecorators(
    ApiOperation({
      summary: '블러팅 신고',
    }),
    ApiParam({
      name: 'id',
      description: '신고할 유저의 id',
      required: true,
      type: Number,
    }),
    ApiBody({ type: ReportingRequestDto, description: '신고 사유' }),
  );
}
