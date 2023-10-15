import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/users.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './passport/refreshToken.strategy';
import { LocalStrategy } from './passport/local.strategy';
import AuthMailEntity from 'src/entities/authMail.entity';
import AuthPhoneNumberEntity from 'src/entities/authPhoneNumber.entity';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AuthMailEntity, AuthPhoneNumberEntity]),
    JwtModule.register({}),
    MailerModule,
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
