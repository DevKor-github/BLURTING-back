import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SignupPayload } from 'src/interfaces/auth';

export const SignupUser = createParamDecorator(
  (_: never, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    return request.user as SignupPayload;
  },
);
