import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { JwtPayload } from 'src/interfaces/auth';
import { UserService } from 'src/user/user.service';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'access') {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.ACCESS_TOKEN_SECRET_KEY,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userService.findUserByVal('id', payload.id);

    if (!user || user.id != payload.id) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
