import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
  sub: string;
  userId: string;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
