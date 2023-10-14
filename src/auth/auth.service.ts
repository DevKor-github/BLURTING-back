import { Injectable, Logger } from '@nestjs/common';
import { UnprocessableEntityException } from '@nestjs/common/exceptions';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { JwtPayload, SignupPayload } from 'src/interfaces/auth';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  private readonly logger = new Logger(AuthService.name);

  async getRefreshToken({ id }) {
    const payload: JwtPayload = {
      id: id,
      signedAt: new Date().toISOString(),
    };

    const refreshJwt = await this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET_KEY,
    });
    this.userService.updateUser(id, 'token', refreshJwt);

    return refreshJwt;
  }

  async getAccessToken({ id }) {
    const payload: JwtPayload = {
      id: id,
      signedAt: new Date().toISOString(),
    };

    const accessJwt = await this.jwtService.sign(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET_KEY,
      expiresIn: '1h',
    });

    return accessJwt;
  }

  async getSignupToken(signupPayload: SignupPayload) {
    const payload: SignupPayload = {
      id: signupPayload.id,
      infoId: signupPayload.infoId,
      page: signupPayload.page + 1,
    };

    const signupJwt = await this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET_KEY,
    });

    return signupJwt;
  }

  async validateUser(id: number) {
    const user = await this.userService.findUser('id', id);

    if (!user) {
      throw new UnprocessableEntityException('등록되지 않은 사용자입니다.');
    }
    return user;
  }
}
