import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';
import { Db } from '../common/transaction.service';
const MAX_ATTEMPTS = 3;
const LEASE_MS = 60_000;
const RETRY_MS = 30_000;
@Injectable()
export class NotificationsService {
  private delivering = false;
  constructor(private readonly prisma: PrismaService) {}
  async enqueue(db: Db, recipients: string[], type: string, resourceId: string) {
    for (const recipientId of new Set(recipients)) await db.notification.create({ data: { recipientId, type, resourceId } });
  }
  async deliver() {
    if (this.delivering) return;
    this.delivering = true;
    try {
      const now = new Date();
      const expired: Prisma.NotificationWhereInput = {
        status: 'SENDING', OR: [{ leaseUntil: { lte: now } }, { leaseUntil: null }, { leaseUntil: { isSet: false } }],
      };
      const available: Prisma.NotificationWhereInput = { attempts: { lt: MAX_ATTEMPTS } };
      await this.prisma.notification.updateMany({ where: { AND: [expired, { attempts: { gte: MAX_ATTEMPTS } }] }, data: { status: 'FAILED', errorCode: 'DELIVERY_ATTEMPTS_EXHAUSTED', claimToken: null, leaseUntil: null } });
      await this.prisma.notification.updateMany({ where: { AND: [expired, available] }, data: { status: 'PENDING', claimToken: null, leaseUntil: null, nextAttemptAt: now } });
      const pending = await this.prisma.notification.findMany({
        where: { status: 'PENDING', AND: [available, { OR: [{ nextAttemptAt: { lte: now } }, { nextAttemptAt: null }, { nextAttemptAt: { isSet: false } }] }] },
        orderBy: { createdAt: 'asc' }, take: 50,
      });
      for (const item of pending) {
        const claimToken = randomUUID(), attempts = item.attempts + 1;
        const claim = await this.prisma.notification.updateMany({
          where: { id: item.id, status: 'PENDING', AND: [available,
            { attempts: item.attempts },
            { OR: [{ nextAttemptAt: { lte: new Date() } }, { nextAttemptAt: null }, { nextAttemptAt: { isSet: false } }] },
          ] },
          data: { status: 'SENDING', attempts, claimToken, leaseUntil: new Date(Date.now() + LEASE_MS), nextAttemptAt: null },
        });
        if (!claim.count) continue;
        // Compare the claim token so a late worker cannot overwrite a newer lease.
        const finish = (data: Prisma.NotificationUpdateManyMutationInput) => this.prisma.notification.updateMany({
          where: { id: item.id, status: 'SENDING', claimToken }, data: { ...data, claimToken: null, leaseUntil: null },
        });
        const retry = (errorCode: string) => finish({
          status: attempts < MAX_ATTEMPTS ? 'PENDING' : 'FAILED', errorCode,
          nextAttemptAt: attempts < MAX_ATTEMPTS ? new Date(Date.now() + RETRY_MS * attempts) : null,
        });
        try {
          const tokens = await this.prisma.deviceToken.findMany({ where: { userId: item.recipientId } });
          if (!tokens.length) {
            await finish({ status: 'UNAVAILABLE', errorCode: 'NO_DEVICE' });
            continue;
          }
          const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST', headers: { 'Content-Type': 'application/json', ...(process.env.EXPO_ACCESS_TOKEN ? { Authorization: 'Bearer ' + process.env.EXPO_ACCESS_TOKEN } : {}) },
            body: JSON.stringify(tokens.map(t => ({ to: t.token, title: 'FITNESS-MANAGE', body: item.type === 'EXTERNAL_PT_CONFIRM' ? 'Có yêu cầu xác nhận PT ngoài. Mở app để kiểm tra.' : 'Lịch tập của bạn vừa được cập nhật.', data: { notificationId: item.id, type: item.type, resourceId: item.resourceId } }))),
            signal: AbortSignal.timeout(10000),
          });
          if (response.status === 429 || response.status >= 500) {
            await retry('PUSH_UNAVAILABLE');
            continue;
          }
          const result = await response.json() as { data?: { status: string }[] };
          const accepted = response.ok && Array.isArray(result.data) && result.data.length === tokens.length && result.data.every(ticket => ticket.status === 'ok');
          // A partially accepted batch must not be resent to already accepted devices.
          await finish({ status: accepted ? 'SENT' : 'FAILED', errorCode: accepted ? null : 'PUSH_REJECTED' });
        } catch {
          await retry('PUSH_UNAVAILABLE').catch(() => undefined);
        }
      }
    } finally { this.delivering = false; }
  }
}
