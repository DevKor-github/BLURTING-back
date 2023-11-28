import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { ReportService } from './report.service';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtPayload } from 'src/interfaces/auth';
import { ReportingRequestDto } from './dtos/reportingRequest.dto';

@Controller('report')
@ApiTags('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('/:id')
  @ApiOperation({
    summary: '블러팅 신고',
  })
  @ApiParam({
    name: 'id',
    description: '신고할 유저의 id',
    required: true,
    type: Number,
  })
  @ApiBody({ type: ReportingRequestDto, description: '신고 사유' })
  async reportUser(
    @Param('id') reportingId: number,
    @Req() req: Request,
    @Body() body: ReportingRequestDto,
  ) {
    const { id } = req.user as JwtPayload;
    await this.reportService.reportUser(id, reportingId, body.reason);
  }
}
