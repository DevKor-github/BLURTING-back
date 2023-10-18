import {
  UserEntity,
  AuthMailEntity,
  AuthPhoneNumberEntity,
} from 'src/entities';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { LocalStrategy } from './passport/local.strategy';
import { MailerModule } from '@nestjs-modules/mailer';
import { JwtSignupStrategy } from './passport/jwt-signup.strategy';
import { JwtAccessStrategy } from './passport/jwt-access.strategy';
import { JwtRefreshStrategy } from './passport/jwt-refresh.strategy';
@Module({
  imports: [ 
    UserModule,
    PassportModule.register({ session: false }),
    TypeOrmModule.forFeature([
      UserEntity,
      AuthMailEntity,
      AuthPhoneNumberEntity,
    ]),
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
