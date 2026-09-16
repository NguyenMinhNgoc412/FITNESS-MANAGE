import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';

type TokenPayload = { sub: string; role: string; sessionId: string };
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.status !== 'ACTIVE' || !(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');
    return this.issue(user.id, user.role);
  }
  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<TokenPayload>(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
      const session = await this.prisma.session.findUnique({ where: { id: payload.sessionId }, include: { user: true } });
      if (!session || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== 'ACTIVE' || !(await bcrypt.compare(refreshToken, session.refreshTokenHash))) throw new Error('invalid');
      await this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
      return this.issue(session.user.id, session.user.role);
    } catch { throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn.'); }
  }
  async logout(sessionId: string) { await this.prisma.session.updateMany({ where: { id: sessionId, revokedAt: null }, data: { revokedAt: new Date() } }); }
  private async issue(userId: string, role: string) {
    const sessionId = randomUUID(); const payload: TokenPayload = { sub: userId, role, sessionId };
    const accessTtl = process.env.JWT_ACCESS_TTL ?? '15m';
    const refreshTtl = process.env.JWT_REFRESH_TTL ?? '7d';
    const accessToken = await this.jwt.signAsync(payload, { secret: process.env.JWT_ACCESS_SECRET, expiresIn: accessTtl as never });
    const refreshToken = await this.jwt.signAsync(payload, { secret: process.env.JWT_REFRESH_SECRET, expiresIn: refreshTtl as never });
    const decoded = this.jwt.decode(refreshToken) as { exp: number };
    await this.prisma.session.create({ data: { id: sessionId, userId, refreshTokenHash: await bcrypt.hash(refreshToken, 12), expiresAt: new Date(decoded.exp * 1000) } });
    return { accessToken, refreshToken, user: { id: userId, role } };
  }
}
