import { Module } from '@nestjs/common';
import { BlurtingController } from './blurting.controller';
import { BlurtingService } from './blurting.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  UserEntity,
  BlurtingGroupEntity,
  BlurtingQuestionEntity,
  BlurtingAnswerEntity,
} from 'src/entities';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([
      UserEntity,
      BlurtingGroupEntity,
      BlurtingQuestionEntity,
      BlurtingAnswerEntity,
    ]),
  ],
  controllers: [BlurtingController],
  providers: [BlurtingService],
})
export class BlurtingModule {}
