import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { AuthService } from './auth.service';
jest.mock('bcryptjs', () => ({ compare: jest.fn(), hash: jest.fn() }));
describe('AuthService three-role sessions', () => {
  it('tạo session độc lập cho Owner, PT và Member', async () => {
    const users = [
      { id: 'owner-1', email: 'owner@test.dev', role: Role.OWNER_ADMIN, status: 'ACTIVE', passwordHash: 'hash' },
      { id: 'pt-1', email: 'pt@test.dev', role: Role.PT, status: 'ACTIVE', passwordHash: 'hash' },
      { id: 'member-1', email: 'member@test.dev', role: Role.MEMBER, status: 'ACTIVE', passwordHash: 'hash' },
    ];
    const prisma = { user: { findUnique: jest.fn(({ where }) => Promise.resolve(users.find((user) => user.email === where.email))) }, session: { create: jest.fn() } } as unknown as PrismaService;
    const jwt = { signAsync: jest.fn((payload) => Promise.resolve(`token-${payload.sessionId}`)), decode: jest.fn(() => ({ exp: Math.floor(Date.now() / 1000) + 3600 })) } as unknown as JwtService;
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never); jest.mocked(bcrypt.hash).mockResolvedValue('refresh-hash' as never);
    const service = new AuthService(prisma, jwt);
    const sessions = await Promise.all(users.map((user) => service.login(user.email, 'password123')));
    expect(new Set(sessions.map((session) => session.accessToken)).size).toBe(3);
    expect(sessions.map((session) => session.user.role)).toEqual([Role.OWNER_ADMIN, Role.PT, Role.MEMBER]);
    expect(prisma.session.create).toHaveBeenCalledTimes(3);
  });
});
