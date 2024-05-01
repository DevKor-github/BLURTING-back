import { Injectable } from '@nestjs/common';
import { ReportRepository } from 'src/repositories';

@Injectable()
export class ReportService {
  constructor(private readonly reportRepository: ReportRepository) {}

  async reportUser(
    reporterId: number,
    reportedId: number,
    reason: string,
  ): Promise<void> {
    await this.reportRepository.insert(reporterId, reportedId, reason);
  }

  async checkReport(users: number[]): Promise<boolean> {
    return await this.reportRepository.existByUsers(users);
  }
}
