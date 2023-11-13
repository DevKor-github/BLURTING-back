import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UserService } from 'src/user/user.service';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, Observable } from 'rxjs';

@Injectable()
export class SignupGuard extends AuthGuard('signup') {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly reflector: Reflector,
  ) {
    super(reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
      const user = await this.userService.createUser();
      const userInfo = await this.userService.createUserInfo(user);
      const newToken = await this.authService.getSignupToken({
        id: user.id,
        infoId: userInfo.id,
        page: 1,
      });
      res.json({ signupToken: newToken });
      return false;
    }

    const result = super.canActivate(context);
    if (typeof result === 'boolean' || result instanceof Promise) {
      return result;
    } else if (result instanceof Observable) {
      return await lastValueFrom(result);
    } else {
      throw new Error('Unexpected canActivate return value');
    }
  }
}
