import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Db } from '../common/transaction.service';
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}
  async enqueue(db: Db, recipients: string[], type: string, resourceId: string) {
    for (const recipientId of new Set(recipients)) await db.notification.create({ data: { recipientId, type, resourceId } });
  }
  async deliver() {
    const pending = await this.prisma.notification.findMany({ where: { status: 'PENDING' }, take: 50 });
    for (const item of pending) {
      // Claim before sending; another API worker must not send this batch twice.
      const claim = await this.prisma.notification.updateMany({ where: { id: item.id, status: 'PENDING' }, data: { status: 'SENDING' } });
      if (!claim.count) continue;
      try {
        const tokens = await this.prisma.deviceToken.findMany({ where: { userId: item.recipientId } });
        if (!tokens.length) {
          await this.prisma.notification.update({ where: { id: item.id }, data: { status: 'UNAVAILABLE', errorCode: 'NO_DEVICE' } });
          continue;
        }
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...(process.env.EXPO_ACCESS_TOKEN ? { Authorization: 'Bearer ' + process.env.EXPO_ACCESS_TOKEN } : {}) },
          body: JSON.stringify(tokens.map(t => ({ to: t.token, title: 'FITNESS-MANAGE', body: item.type === 'EXTERNAL_PT_CONFIRM' ? 'Có yêu cầu xác nhận PT ngoài. Mở app để kiểm tra.' : 'Lịch tập của bạn vừa được cập nhật.', data: { type: item.type, resourceId: item.resourceId } }))),
          signal: AbortSignal.timeout(10000),
        });
        const result = await response.json() as { data?: { status: string }[] };
        const accepted = response.ok && result.data?.length === tokens.length && result.data.every(ticket => ticket.status === 'ok');
        await this.prisma.notification.update({ where: { id: item.id }, data: { status: accepted ? 'SENT' : 'FAILED', errorCode: accepted ? null : 'PUSH_REJECTED' } });
      } catch {
        await this.prisma.notification.updateMany({ where: { id: item.id }, data: { status: 'FAILED', errorCode: 'PUSH_UNAVAILABLE' } }).catch(() => undefined);
      }
    }
  }
}
