import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppStoreConnectTransactionEntity } from 'src/domain/entities';
import { ValidationController } from './validation.controller';
import { ValidationService } from './validation.service';
import { PointModule } from '../point/point.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppStoreConnectTransactionEntity]),
    PointModule,
  ],
  controllers: [ValidationController],
  providers: [ValidationService],
  exports: [ValidationService],
})
export class ValidationModule {}
