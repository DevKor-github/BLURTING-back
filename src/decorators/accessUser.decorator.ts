import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from 'src/interfaces/auth';

export const User = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    return request.user as JwtPayload;
  },
);
