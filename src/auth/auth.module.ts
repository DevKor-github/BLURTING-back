import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  UserEntity,
  AuthMailEntity,
  AuthPhoneNumberEntity,
} from 'src/entities';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './passport/refreshToken.strategy';
import { LocalStrategy } from './passport/local.strategy';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      AuthMailEntity,
      AuthPhoneNumberEntity,
    ]),
    JwtModule.register({}),
    MailerModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
})
export class AuthModule {}
