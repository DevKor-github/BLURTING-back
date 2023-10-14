import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/users.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtAccessStrategy } from './passport/jwt-access.strategy';
import { JwtRefreshStrategy } from './passport/jwt-refresh.strategy';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from 'src/user/user.module';
import { JwtSignupStrategy } from './passport/jwt-signup.strategy';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([UserEntity]),
    PassportModule.register({ session: false }),
    JwtModule.register({}),
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
