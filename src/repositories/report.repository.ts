import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReportEntity } from 'src/entities';
import { Repository } from 'typeorm';

@Injectable()
export class ReportRepository {
  constructor(
    @InjectRepository(ReportEntity)
    private readonly reportRepository: Repository<ReportEntity>,
  ) {}

  async findAllReported(userId: number): Promise<ReportEntity[]> {
    return this.reportRepository.find({
      where: { reporterUser: { id: userId } },
      relations: ['reportedUser'],
    });
  }
}
