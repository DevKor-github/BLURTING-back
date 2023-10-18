import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { SignupPayload } from 'src/interfaces/auth';
import { UserService } from 'src/user/user.service';

@Injectable()
export class JwtSignupStrategy extends PassportStrategy(Strategy, 'signup') {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET_KEY,
    });
  }

  async validate(payload: SignupPayload): Promise<SignupPayload> {
    if (!payload.id || !payload.infoId || !payload.page) {
      throw new UnauthorizedException();
    }
    return payload;
  }
}
