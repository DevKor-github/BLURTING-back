import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { UserEntity, UserInfoEntity, UserImageEntity } from 'src/entities';
import { SocketUser, SocketUserSchema } from 'src/chat/models';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { FcmModule } from 'src/firebase/fcm.module';

@Module({
  imports: [
    FcmModule,
    TypeOrmModule.forFeature([UserEntity, UserInfoEntity, UserImageEntity]),
    MongooseModule.forFeature([
      { name: SocketUser.name, schema: SocketUserSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
