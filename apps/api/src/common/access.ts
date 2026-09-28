import { createParamDecorator, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';
export type Actor = { sub: string; role: Role; sessionId: string };
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): Actor => ctx.switchToHttp().getRequest().user);
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
export function requireRole(actor: Actor, ...roles: Role[]) {
  if (!roles.includes(actor.role)) throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.' });
}
export function requireSelfOrOwner(actor: Actor, memberId: string) {
  if (actor.role !== Role.OWNER && !(actor.role === Role.MEMBER && actor.sub === memberId)) {
    throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Bạn không có quyền xem hồ sơ này.' });
  }
}
