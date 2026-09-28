import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { Db, TransactionService } from '../common/transaction.service';

export type TokenPayload = { sub: string; role: Role; sessionId: string; kind: 'access' | 'refresh' };
const tokenHash = (value: string) => createHash('sha256').update(value).digest('hex');
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService, private readonly transactions: TransactionService) {}
  async login(phone: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user || user.status !== 'ACTIVE' || !(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không đúng.');
    return this.transactions.run(async db => {
      const current = await db.user.findUnique({ where: { id: user.id } });
      if (!current || current.status !== 'ACTIVE') throw new UnauthorizedException();
      return this.issue(db, current.id, current.role);
    });
  }
  async refresh(token: string) {
    let payload: TokenPayload;
    try { payload = await this.jwt.verifyAsync<TokenPayload>(token, { secret: process.env.JWT_REFRESH_SECRET }); }
    catch { throw new UnauthorizedException('Phiên đăng nhập đã hết hạn.'); }
    if (payload.kind !== 'refresh') throw new UnauthorizedException();
    return this.transactions.run(async db => {
      const session = await db.session.findUnique({ where: { id: payload.sessionId }, include: { user: true } });
      if (!session || session.userId !== payload.sub || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== 'ACTIVE' || session.refreshTokenHash !== tokenHash(token)) throw new UnauthorizedException('Phiên đăng nhập không hợp lệ.');
      await db.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
      return this.issue(db, session.userId, session.user.role);
    });
  }
  async logout(sessionId: string) {
    await this.transactions.run(db => db.session.updateMany({ where: { id: sessionId }, data: { revokedAt: new Date() } }));
  }
  profile(userId: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, phone: true, role: true, status: true, profile: true } });
  }
  private async issue(db: Db, userId: string, role: Role) {
    const sessionId = randomBytes(12).toString('hex');
    const payload = { sub: userId, role, sessionId };
    const accessToken = await this.jwt.signAsync({ ...payload, kind: 'access' }, { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '15m' });
    const refreshToken = await this.jwt.signAsync({ ...payload, kind: 'refresh' }, { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' });
    const decoded = this.jwt.decode(refreshToken) as { exp: number };
    await db.session.create({ data: { id: sessionId, userId, refreshTokenHash: tokenHash(refreshToken), expiresAt: new Date(decoded.exp * 1000) } });
    return { accessToken, refreshToken, user: { id: userId, role } };
  }
}
