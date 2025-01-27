import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReportEntity } from 'src/domain/entities';
import { Repository } from 'typeorm';

@Injectable()
export class ReportRepository {
  constructor(
    @InjectRepository(ReportEntity)
    private readonly reportRepository: Repository<ReportEntity>,
  ) {}

  async existByUsers(users: number[]): Promise<boolean> {
    return await this.reportRepository.exist({
      where: [
        { reporterUser: { id: users[0] }, reportedUser: { id: users[1] } },
        { reporterUser: { id: users[1] }, reportedUser: { id: users[0] } },
      ],
    });
  }

  async findAllReported(userId: number): Promise<ReportEntity[]> {
    return this.reportRepository.find({
      where: { reporterUser: { id: userId } },
      relations: ['reportedUser'],
    });
  }

  async insert(
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
}
