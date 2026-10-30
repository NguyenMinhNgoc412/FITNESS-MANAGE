import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { PrismaClient } from '@prisma/client';
export async function ensureIndexes(prisma: PrismaClient) {
  // Idempotent backfill for notification records created before delivery leases.
  await prisma.$runCommandRaw({ update: 'notifications', updates: [
    { q: { attempts: { $exists: false } }, u: { $set: { attempts: 0 } }, multi: true },
  ] });
  await prisma.$runCommandRaw({ createIndexes: 'profiles', indexes: [
    { key: { cccd: 1 }, name: 'profiles_cccd_unique_present', unique: true, partialFilterExpression: { cccd: { $type: 'string' } } },
  ] });
  await prisma.$runCommandRaw({ createIndexes: 'customers', indexes: [
    { key: { memberUserId: 1 }, name: 'customers_member_unique_present', unique: true, partialFilterExpression: { memberUserId: { $type: 'objectId' } } },
  ] });
  await prisma.$runCommandRaw({ createIndexes: 'pt_assignments', indexes: [
    { key: { memberId: 1 }, name: 'one_active_primary_pt', unique: true, partialFilterExpression: { status: 'ACTIVE' } },
  ] });
  await prisma.writeLock.upsert({ where: { id: 'business' }, create: { id: 'business' }, update: {} });
  await prisma.$runCommandRaw({ createIndexes: 'body_measurements', indexes: [
    { key: { memberId: 1, measurementDate: 1 }, name: 'one_active_measurement_per_day', unique: true, partialFilterExpression: { status: 'ACTIVE' } },
  ] });
  await prisma.$runCommandRaw({ createIndexes: 'audit_logs', indexes: [
    { key: { resourceType: 1, 'before.memberId': 1, createdAt: -1 }, name: 'audit_booking_member_before' },
    { key: { resourceType: 1, 'after.memberId': 1, createdAt: -1 }, name: 'audit_booking_member_after' },
  ] });
}
if (require.main === module) {
  if (existsSync('.env')) loadEnvFile('.env');
  const prisma = new PrismaClient();
  ensureIndexes(prisma).catch(() => { console.error('Không tạo được indexes. Kiểm tra MongoDB và dữ liệu trùng trước khi chạy lại.'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
}
