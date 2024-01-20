import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { UserEntity, UserInfoEntity, UserImageEntity } from 'src/entities';
import {
  SocketUser,
  SocketUserSchema,
  Room,
  RoomSchema,
} from 'src/chat/models';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { FcmModule } from 'src/firebase/fcm.module';

@Module({
  imports: [
    FcmModule,
    TypeOrmModule.forFeature([UserEntity, UserInfoEntity, UserImageEntity]),
    MongooseModule.forFeature([
      { name: SocketUser.name, schema: SocketUserSchema },
      { name: Room.name, schema: RoomSchema },
    ]),
    CacheModule.register({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      store: async () =>
        await redisStore({
          socket: {
            host: 'localhost',
            port: 6379,
          },
        }),
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
