import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/users.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserInfoEntity } from 'src/entities/userInfo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, UserInfoEntity])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
