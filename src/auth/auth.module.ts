import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import User from 'src/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './passport/refreshToken.strategy';
import { LocalStrategy } from './passport/local.strategy';
import AuthMailEntity from 'src/entities/authMail.entity';
import AuthPhoneNumberEntity from 'src/entities/authPhoneNumber.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AuthMailEntity, AuthPhoneNumberEntity]),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
})
export class AuthModule {}
