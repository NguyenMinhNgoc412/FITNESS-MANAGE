import { Role } from '@prisma/client';
import { Db } from '../common/transaction.service';
import { fail } from '../common/errors';
export async function activeUser(db: Db, id: string, role: Role) {
  const user = await db.user.findUnique({ where: { id }, include: { profile: true } });
  if (!user || user.role !== role || user.status !== 'ACTIVE') fail('ACCOUNT_UNAVAILABLE', 'Tài khoản không tồn tại hoặc không hoạt động.', 400);
  return user;
}
export async function uniqueIdentity(db: Db, phone: string, cccd: string, exceptId?: string) {
  if (await db.user.findFirst({ where: { phone, ...(exceptId ? { id: { not: exceptId } } : {}) } })) fail('PHONE_EXISTS', 'Số điện thoại đã có tài khoản.');
  if (await db.profile.findFirst({ where: { cccd, ...(exceptId ? { userId: { not: exceptId } } : {}) } })) fail('CCCD_EXISTS', 'Thông tin định danh đã được sử dụng.');
}
