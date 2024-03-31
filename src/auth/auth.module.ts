import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  UserEntity,
  AuthMailEntity,
  AuthPhoneNumberEntity,
  UserImageEntity,
  ToCheckEntity,
} from 'src/entities';
import {
  JwtSignupStrategy,
  JwtAccessStrategy,
  JwtRefreshStrategy,
} from './passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MailerModule } from '@nestjs-modules/mailer';
import { UserModule } from 'src/user/user.module';
import { PointModule } from 'src/point/point.module';
@Module({
  imports: [
    UserModule,
    PassportModule.register({ session: false }),
    TypeOrmModule.forFeature([
      UserEntity,
      AuthMailEntity,
      AuthPhoneNumberEntity,
      UserImageEntity,
      ToCheckEntity,
    ]),
    JwtModule.register({}),
    MailerModule,
    UserModule,
    PointModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    JwtSignupStrategy,
  ],
  exports: [
    AuthService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    JwtSignupStrategy,
  ],
})
export class AuthModule {}
