import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { TokenPayload } from './auth.service';
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const match = /^Bearer (.+)$/i.exec(request.headers.authorization ?? '');
    if (!match) throw new UnauthorizedException('Bạn cần đăng nhập.');
    try {
      const payload = await this.jwt.verifyAsync<TokenPayload>(match[1], { secret: process.env.JWT_ACCESS_SECRET });
      if (payload.kind !== 'access') throw new Error();
      const session = await this.prisma.session.findUnique({ where: { id: payload.sessionId }, include: { user: true } });
      if (!session || session.userId !== payload.sub || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== 'ACTIVE') throw new Error();
      request.user = { sub: session.userId, role: session.user.role, sessionId: session.id };
      return true;
    } catch { throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'); }
  }
}
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Role[]>('roles', [context.getHandler(), context.getClass()]);
    const actor = context.switchToHttp().getRequest().user;
    if (!actor || !roles?.includes(actor.role)) throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này.');
    return true;
  }
}
