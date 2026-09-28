import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma.service';
import { Actor } from './access';
import { fail } from './errors';

export type Db = Prisma.TransactionClient;
export function json(value: unknown): Prisma.InputJsonValue { return JSON.parse(JSON.stringify(value)); }
export function audit(db: Db, actor: Actor, action: string, resourceType: string, resourceId: string, reason?: string, before?: unknown, after?: unknown) {
  return db.auditLog.create({ data: { actorId: actor.sub, action, resourceType, resourceId, reason, ...(before ? { before: json(before) } : {}), ...(after ? { after: json(after) } : {}) } });
}
@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}
  async run<T>(work: (db: Db) => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        return await this.prisma.$transaction(async db => {
          // A persisted write lock serializes critical commands across API processes.
          // MongoDB detects a competing snapshot writer; retry re-reads fresh state.
          await db.writeLock.update({ where: { id: 'business' }, data: { version: { increment: 1 } } });
          return work(db);
        }, { maxWait: 10000, timeout: 20000 });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2034' && attempt < 7) {
            await new Promise(resolve => setTimeout(resolve, 15 * (attempt + 1)));
            continue;
          }
          if (error.code === 'P2002') fail('DUPLICATE_IDENTITY', 'Thông tin này đã tồn tại.');
        }
        throw error;
      }
    }
    return fail('CONCURRENT_CHANGE', 'Dữ liệu đang được cập nhật. Vui lòng thử lại.');
  }
  command<T>(actor: Actor, action: string, key: string | undefined, input: unknown, work: (db: Db, commandId: string) => Promise<T>): Promise<T> {
    if (!key || !/^[a-zA-Z0-9_-]{8,100}$/.test(key)) fail('IDEMPOTENCY_KEY_REQUIRED', 'Thiếu mã yêu cầu hợp lệ.', 400);
    const commandId = actor.sub + ':' + action + ':' + key;
    const fingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex');
    return this.run(async db => {
      const currentActor = await db.user.findUnique({ where: { id: actor.sub }, select: { role: true, status: true } });
      if (!currentActor || currentActor.status !== 'ACTIVE' || currentActor.role !== actor.role) fail('FORBIDDEN', 'Tài khoản không còn quyền thực hiện thao tác này.', 403);
      const old = await db.command.findUnique({ where: { id: commandId } });
      if (old) {
        if (old.fingerprint !== fingerprint) fail('IDEMPOTENCY_CONFLICT', 'Mã yêu cầu đã được dùng với nội dung khác.');
        return old.result as T;
      }
      const result = await work(db, commandId);
      await db.command.create({ data: { id: commandId, fingerprint, result: json(result) } });
      return result;
    });
  }
}
