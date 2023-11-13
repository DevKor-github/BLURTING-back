import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity, UserInfoEntity, UserImageEntity } from 'src/entities';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { FcmModule } from 'src/firebase/fcm.module';

@Module({
  imports: [
    FcmModule,
    TypeOrmModule.forFeature([UserEntity, UserInfoEntity, UserImageEntity]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
