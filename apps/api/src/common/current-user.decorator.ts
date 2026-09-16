import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export type AuthUser = { sub: string; role: string; sessionId: string };
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user);
