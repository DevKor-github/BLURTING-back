import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthPhoneNumberEntity } from 'src/entities';
import {
  JwtSignupStrategy,
  JwtAccessStrategy,
  JwtRefreshStrategy,
} from './passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { AuthPhoneNumberRepository } from 'src/repositories';
@Module({
  imports: [
    UserModule,
    PassportModule.register({ session: false }),
    TypeOrmModule.forFeature([AuthPhoneNumberEntity]),
    JwtModule.register({}),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    JwtSignupStrategy,
    AuthPhoneNumberRepository,
  ],
  exports: [
    AuthService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    JwtSignupStrategy,
  ],
})
export class AuthModule {}
