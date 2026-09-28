import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { PrismaClient } from '@prisma/client';
export async function ensureIndexes(prisma: PrismaClient) {
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
}
if (require.main === module) {
  if (existsSync('.env')) loadEnvFile('.env');
  const prisma = new PrismaClient();
  ensureIndexes(prisma).catch(() => { console.error('Không tạo được indexes. Kiểm tra MongoDB và dữ liệu trùng trước khi chạy lại.'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
}
