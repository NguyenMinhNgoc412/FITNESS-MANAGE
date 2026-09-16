import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccountStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const context = (request: Record<string, unknown>) => ({ switchToHttp: () => ({ getRequest: () => request }) }) as ExecutionContext;
  it('từ chối access token của session đã logout', async () => {
    const jwt = { verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-1', role: Role.OWNER_ADMIN, sessionId: 'session-1' }) } as unknown as JwtService;
    const prisma = { session: { findUnique: jest.fn().mockResolvedValue({ userId: 'user-1', expiresAt: new Date(Date.now() + 60_000), revokedAt: new Date(), user: { role: Role.OWNER_ADMIN, status: AccountStatus.ACTIVE } }) } } as unknown as PrismaService;
    const guard = new JwtAuthGuard(jwt, prisma);
    await expect(guard.canActivate(context({ headers: { authorization: 'Bearer token' } }))).rejects.toThrow(UnauthorizedException);
  });
  it('lấy role hiện tại từ database cho session còn hiệu lực', async () => {
    const jwt = { verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-1', role: Role.MEMBER, sessionId: 'session-1' }) } as unknown as JwtService;
    const prisma = { session: { findUnique: jest.fn().mockResolvedValue({ userId: 'user-1', expiresAt: new Date(Date.now() + 60_000), revokedAt: null, user: { role: Role.PT, status: AccountStatus.ACTIVE } }) } } as unknown as PrismaService;
    const request = { headers: { authorization: 'Bearer token' } } as Record<string, unknown>;
    await expect(new JwtAuthGuard(jwt, prisma).canActivate(context(request))).resolves.toBe(true);
    expect(request.user).toEqual(expect.objectContaining({ role: Role.PT }));
  });
});
