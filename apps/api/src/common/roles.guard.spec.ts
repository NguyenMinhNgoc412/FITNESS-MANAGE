import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const makeContext = (role: Role) => ({ getHandler: () => undefined, getClass: () => undefined, switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }) }) as never;
  it('cho phép Owner thực hiện action của Owner', () => {
    const guard = new RolesGuard({ getAllAndOverride: () => [Role.OWNER_ADMIN] } as never);
    expect(guard.canActivate(makeContext(Role.OWNER_ADMIN))).toBe(true);
  });
  it('từ chối Member gọi action của Owner', () => {
    const guard = new RolesGuard({ getAllAndOverride: () => [Role.OWNER_ADMIN] } as never);
    expect(() => guard.canActivate(makeContext(Role.MEMBER))).toThrow(ForbiddenException);
  });
});
