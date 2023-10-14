import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { RefreshJwtPayload } from 'src/interfaces/auth';
import { UserService } from 'src/user/user.service';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.REFRESH_TOKEN_SECRET_KEY,
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: RefreshJwtPayload,
  ): Promise<RefreshJwtPayload> {
    console.log(payload);
    const refreshToken = req.headers.authorization.split('Bearer ')[1];

    const user = await this.userService.findUser('token', refreshToken);
    if (!user || user.id != payload.id) {
      throw new Error('Invalid refresh token');
    }

    return {
      ...payload,
      refreshToken,
    };
  }
}
