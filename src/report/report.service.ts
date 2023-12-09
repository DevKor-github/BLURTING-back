import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReportEntity } from 'src/entities/report.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(ReportEntity)
    private readonly reportRepository: Repository<ReportEntity>,
  ) {}

  async reportUser(
    reporterId: number,
    reportedId: number,
    reason: string,
  ): Promise<void> {
    await this.reportRepository.save({
      reporterUser: { id: reporterId },
      reportedUser: { id: reportedId },
      reason,
    });
  }

  async checkReport(users: number[]): Promise<boolean> {
    const report = await this.reportRepository.findOne({
      where: {
        reporterUser: { id: users[0] },
        reportedUser: { id: users[1] },
      },
    });
    const report2 = await this.reportRepository.findOne({
      where: {
        reporterUser: { id: users[1] },
        reportedUser: { id: users[0] },
      },
    });
    if (report || report2) return true;
    else return false;
  }
}
