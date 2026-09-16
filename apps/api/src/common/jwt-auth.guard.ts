import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccountStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('Cần đăng nhập để thực hiện thao tác này.');
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; role: string; sessionId: string }>(token, { secret: process.env.JWT_ACCESS_SECRET });
      const session = await this.prisma.session.findUnique({
        where: { id: payload.sessionId },
        select: { userId: true, expiresAt: true, revokedAt: true, user: { select: { role: true, status: true } } },
      });
      if (!session || session.userId !== payload.sub || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== AccountStatus.ACTIVE) {
        throw new UnauthorizedException('Tài khoản hoặc phiên đăng nhập không thể truy cập.');
      }
      request.user = { ...payload, role: session.user.role };
      return true;
    } catch { throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'); }
  }
}
