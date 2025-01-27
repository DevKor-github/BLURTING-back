import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportEntity } from 'src/domain/entities/report.entity';
import { ReportRepository } from 'src/domain/repositories';

@Module({
  imports: [TypeOrmModule.forFeature([ReportEntity])],
  controllers: [ReportController],
  providers: [ReportService, ReportRepository],
  exports: [ReportService],
})
export class ReportModule {}
