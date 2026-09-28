import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { phone, password, parse } from '../src/common/input';
import { ensureIndexes } from './indexes';
if (existsSync('.env')) loadEnvFile('.env');
const prisma = new PrismaClient();
async function main() {
  const ownerPhone = parse(phone, process.env.SEED_OWNER_PHONE);
  const ownerPassword = parse(password, process.env.SEED_OWNER_PASSWORD);
  const name = process.env.SEED_OWNER_NAME?.trim();
  if (!name) throw new Error('Configure SEED_OWNER_NAME.');
  await ensureIndexes(prisma);
  const existing = await prisma.user.findUnique({ where: { phone: ownerPhone } });
  if (existing) {
    if (existing.role !== Role.OWNER) throw new Error('Identity exists with another role.');
    return;
  }
  await prisma.user.create({ data: { phone: ownerPhone, passwordHash: await bcrypt.hash(ownerPassword, 12), role: Role.OWNER, profile: { create: { fullName: name } } } });
  console.info('Owner bootstrap completed.');
}
main().catch(() => { console.error('Owner bootstrap failed. Check seed configuration; existing accounts are not overwritten.'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
