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
