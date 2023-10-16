import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import {
  UserEntity,
  AuthMailEntity,
  AuthPhoneNumberEntity,
} from 'src/entities';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtSignupStrategy } from './passport/jwt-signup.strategy';
import { JwtAccessStrategy } from './passport/jwt-access.strategy';
import { JwtRefreshStrategy } from './passport/jwt-refresh.strategy';
import { MailerModule } from '@nestjs-modules/mailer';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      AuthMailEntity,
      AuthPhoneNumberEntity,
    ]),
    PassportModule.register({ session: false }),
    JwtModule.register({}),
    MailerModule,
    UserModule,
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
