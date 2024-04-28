import { Body, Controller, Param, Post } from '@nestjs/common';
import { ReportService } from './report.service';
import { ApiTags } from '@nestjs/swagger';
import { JwtPayload } from 'src/interfaces/auth';
import { ReportingRequestDto } from './dtos/reportingRequest.dto';
import { ReportDocs } from 'src/decorators/swagger/report.decorator';
import { User } from 'src/decorators/accessUser.decorator';

@Controller('report')
@ApiTags('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('/:id')
  @ReportDocs()
  async reportUser(
    @Param('id') reportingId: number,
    @User() userPayload: JwtPayload,
    @Body() body: ReportingRequestDto,
  ) {
    const { id } = userPayload;
    await this.reportService.reportUser(id, reportingId, body.reason);
  }
}
