import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Actor, requireRole } from '../common/access';
import { PrismaService } from '../prisma.service';
@Injectable()
export class DeviceTokensService {
  constructor(private readonly prisma: PrismaService) {}
  registerDevice(actor: Actor, token: string) {
    requireRole(actor, Role.OWNER, Role.PT, Role.MEMBER);
    return this.prisma.deviceToken.upsert({ where: { token }, update: { userId: actor.sub }, create: { userId: actor.sub, token }, select: { id: true } });
  }
  removeDevice(actor: Actor, token: string) {
    requireRole(actor, Role.OWNER, Role.PT, Role.MEMBER);
    return this.prisma.deviceToken.deleteMany({ where: { userId: actor.sub, token } });
  }
}
